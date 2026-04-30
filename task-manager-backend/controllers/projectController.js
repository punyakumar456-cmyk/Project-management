import { all, formatProject, get, getProjectDetails, getProjectMessages, run } from '../config/database.js';

const projectAccessCondition = (userId, isAdmin) =>
  isAdmin
    ? ''
    : `
        WHERE p.owner_id = ${userId}
        OR EXISTS (
          SELECT 1
          FROM project_members pm
          WHERE pm.project_id = p.id AND pm.user_id = ${userId}
        )
      `;

const normalizeAccessMode = (value) => (value === 'Individual' ? 'Individual' : 'Team');

const readMemberIds = (memberIds = []) =>
  [...new Set((Array.isArray(memberIds) ? memberIds : []).map((value) => Number(value)).filter((value) => Number.isInteger(value)))];

export const createProject = async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Only admins can create projects.' });
  }

  const name = req.body.name?.trim();
  const description = req.body.description?.trim() || '';
  const dueDate = req.body.dueDate || null;
  const accessMode = normalizeAccessMode(req.body.accessMode);
  const teamName = req.body.teamName?.trim() || null;
  const memberIds = readMemberIds(req.body.memberIds);

  if (!name) {
    return res.status(400).json({ success: false, message: 'Project name is required.' });
  }

  if (accessMode === 'Individual' && memberIds.length !== 1) {
    return res.status(400).json({
      success: false,
      message: 'Individual projects must be assigned to exactly one member.',
    });
  }

  if (accessMode === 'Team' && memberIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Team projects must include at least one member.',
    });
  }

  const validMembers = memberIds.length
    ? all(
        `
          SELECT id, role
          FROM users
          WHERE role = 'Member' AND id IN (${memberIds.map((id) => Number(id)).join(',')})
        `
      )
    : [];

  if (validMembers.length !== memberIds.length) {
    return res.status(400).json({
      success: false,
      message: 'Only registered members can be assigned to projects.',
    });
  }

  const result = run(
    `
      INSERT INTO projects (name, description, due_date, owner_id, status, access_mode, team_name)
      VALUES (:name, :description, :dueDate, :ownerId, 'Planning', :accessMode, :teamName)
    `,
    {
      name,
      description,
      dueDate,
      ownerId: req.user.id,
      accessMode,
      teamName: accessMode === 'Team' ? teamName || `${name} Team` : null,
    }
  );

  const projectId = Number(result.lastInsertRowid);

  run(
    `
      INSERT INTO project_members (project_id, user_id, role)
      VALUES (:projectId, :userId, 'Admin')
    `,
    {
      projectId,
      userId: req.user.id,
    }
  );

  validMembers.forEach((member) => {
    run(
      `
        INSERT INTO project_members (project_id, user_id, role)
        VALUES (:projectId, :userId, 'Member')
      `,
      {
        projectId,
        userId: member.id,
      }
    );
  });

  run(
    `
      INSERT INTO project_messages (project_id, user_id, message)
      VALUES (:projectId, :userId, :message)
    `,
    {
      projectId,
      userId: req.user.id,
      message:
        accessMode === 'Team'
          ? `Team workspace created for ${teamName || `${name} Team`}.`
          : 'Individual workspace created and ready for assignment.',
    }
  );

  return res.status(201).json({
    success: true,
    message: 'Project created successfully.',
    data: getProjectDetails(projectId),
  });
};

export const getProjects = async (req, res) => {
  const rows = all(
    `
      SELECT
        p.id,
        p.name,
        p.description,
        p.status,
        p.due_date,
        p.owner_id,
        p.access_mode,
        p.team_name,
        p.created_at,
        p.updated_at,
        o.id AS owner_user_id,
        o.name AS owner_name,
        o.email AS owner_email,
        o.role AS owner_role,
        o.created_at AS owner_created_at,
        o.last_login_at AS owner_last_login_at
      FROM projects p
      JOIN users o ON o.id = p.owner_id
      ${projectAccessCondition(req.user.id, req.user.role === 'Admin')}
      ORDER BY p.updated_at DESC, p.created_at DESC
    `
  );

  return res.status(200).json({
    success: true,
    count: rows.length,
    data: rows.map((row) => {
      const project = formatProject(row);
      const currentMember = project.members.find((member) => member.user.id === req.user.id);

      return {
        ...project,
        currentUserRole:
          req.user.role === 'Admin' || project.ownerId === req.user.id ? 'Admin' : currentMember?.role || 'Member',
        permissions: {
          canManage: req.user.role === 'Admin' || project.ownerId === req.user.id || currentMember?.role === 'Admin',
        },
      };
    }),
  });
};

export const getProjectById = async (req, res) => {
  const currentMember = req.project.members.find((member) => member.user.id === req.user.id);

  return res.status(200).json({
    success: true,
    data: {
      ...req.project,
      currentUserRole:
        req.user.role === 'Admin' || req.project.ownerId === req.user.id ? 'Admin' : currentMember?.role || 'Member',
      permissions: {
        canManage: req.projectRole === 'Admin',
      },
    },
  });
};

export const updateProject = async (req, res) => {
  if (req.projectRole !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Only project admins can update projects.' });
  }

  const name = req.body.name?.trim();
  const description = req.body.description?.trim();
  const dueDate = Object.prototype.hasOwnProperty.call(req.body, 'dueDate') ? req.body.dueDate : req.project.dueDate;
  const status = req.body.status;
  const teamName = req.body.teamName?.trim();
  const allowedStatuses = ['Planning', 'Active', 'Completed'];

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid project status.' });
  }

  run(
    `
      UPDATE projects
      SET
        name = COALESCE(:name, name),
        description = COALESCE(:description, description),
        due_date = :dueDate,
        team_name = COALESCE(:teamName, team_name),
        status = COALESCE(:status, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = :projectId
    `,
    {
      name: name || null,
      description: description ?? null,
      dueDate,
      teamName: teamName || null,
      status: status || null,
      projectId: req.project.id,
    }
  );

  return res.status(200).json({
    success: true,
    message: 'Project updated successfully.',
    data: getProjectDetails(req.project.id),
  });
};

export const deleteProject = async (req, res) => {
  const project = getProjectDetails(Number(req.params.projectId));

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  if (req.user.role !== 'Admin' && project.ownerId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Only admins or the project owner can delete a project.' });
  }

  run(`DELETE FROM projects WHERE id = :projectId`, { projectId: project.id });

  return res.status(200).json({
    success: true,
    message: 'Project deleted successfully.',
  });
};

export const addProjectMember = async (req, res) => {
  if (req.projectRole !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Only project admins can manage members.' });
  }

  if (req.project.accessMode === 'Individual') {
    return res.status(400).json({
      success: false,
      message: 'Individual projects can only have one member. Create a team project for shared access.',
    });
  }

  const email = req.body.email?.trim().toLowerCase();
  const role = req.body.role === 'Admin' ? 'Admin' : 'Member';

  if (!email) {
    return res.status(400).json({ success: false, message: 'Member email is required.' });
  }

  const user = get(
    `SELECT id, name, email, role, created_at, last_login_at FROM users WHERE email = :email AND role = 'Member'`,
    { email }
  );

  if (!user) {
    return res.status(404).json({ success: false, message: 'No registered member found with that email.' });
  }

  const existingMember = get(
    `
      SELECT 1
      FROM project_members
      WHERE project_id = :projectId AND user_id = :userId
    `,
    { projectId: req.project.id, userId: user.id }
  );

  if (existingMember) {
    return res.status(409).json({ success: false, message: 'That user is already on the project.' });
  }

  run(
    `
      INSERT INTO project_members (project_id, user_id, role)
      VALUES (:projectId, :userId, :role)
    `,
    {
      projectId: req.project.id,
      userId: user.id,
      role,
    }
  );

  run(
    `
      INSERT INTO project_messages (project_id, user_id, message)
      VALUES (:projectId, :userId, :message)
    `,
    {
      projectId: req.project.id,
      userId: req.user.id,
      message: `${user.name} joined the ${req.project.teamName || 'team'} workspace.`,
    }
  );

  return res.status(200).json({
    success: true,
    message: 'Member added successfully.',
    data: getProjectDetails(req.project.id),
  });
};

export const removeProjectMember = async (req, res) => {
  if (req.projectRole !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Only project admins can manage members.' });
  }

  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid member id.' });
  }

  if (req.project.ownerId === userId) {
    return res.status(400).json({ success: false, message: 'The project owner cannot be removed.' });
  }

  const projectMembers = req.project.members.filter((member) => member.role !== 'Admin');
  if (req.project.accessMode === 'Individual' || projectMembers.length <= 1) {
    return res.status(400).json({
      success: false,
      message: 'This workspace needs at least one assigned member. Delete it or reassign it instead.',
    });
  }

  const removedMember = req.project.members.find((member) => member.user.id === userId);

  run(
    `
      DELETE FROM project_members
      WHERE project_id = :projectId AND user_id = :userId
    `,
    {
      projectId: req.project.id,
      userId,
    }
  );

  run(
    `
      UPDATE tasks
      SET assignee_id = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE project_id = :projectId AND assignee_id = :userId
    `,
    {
      projectId: req.project.id,
      userId,
    }
  );

  if (removedMember) {
    run(
      `
        INSERT INTO project_messages (project_id, user_id, message)
        VALUES (:projectId, :userId, :message)
      `,
      {
        projectId: req.project.id,
        userId: req.user.id,
        message: `${removedMember.user.name} was removed from the workspace.`,
      }
    );
  }

  return res.status(200).json({
    success: true,
    message: 'Member removed successfully.',
    data: getProjectDetails(req.project.id),
  });
};

export const addProjectMessage = async (req, res) => {
  const message = req.body.message?.trim();

  if (!message) {
    return res.status(400).json({ success: false, message: 'Message text is required.' });
  }

  run(
    `
      INSERT INTO project_messages (project_id, user_id, message)
      VALUES (:projectId, :userId, :message)
    `,
    {
      projectId: req.project.id,
      userId: req.user.id,
      message,
    }
  );

  return res.status(201).json({
    success: true,
    message: 'Workspace message sent successfully.',
    data: getProjectMessages(req.project.id),
  });
};
