import { addTaskActivity, all, formatTask, get, getProjectDetails, getProjectRole, getTaskDetails, run } from '../config/database.js';

const allowedStatuses = ['To Do', 'In Progress', 'Done'];
const allowedPriorities = ['Low', 'Medium', 'High'];

const canManageTask = (user, projectId) =>
  user.role === 'Admin' || getProjectRole(projectId, user.id) === 'Admin';

const canUpdateTask = (user, task) =>
  user.role === 'Admin' ||
  getProjectRole(task.projectId, user.id) === 'Admin' ||
  task.assigneeId === user.id;

export const createTask = async (req, res) => {
  const projectId = Number(req.body.projectId);
  const title = req.body.title?.trim();
  const description = req.body.description?.trim() || '';
  const status = req.body.status || 'To Do';
  const priority = req.body.priority || 'Medium';
  let assigneeId = req.body.assigneeId ? Number(req.body.assigneeId) : null;
  const dueDate = req.body.dueDate || null;

  if (!title || !projectId) {
    return res.status(400).json({ success: false, message: 'Project and task title are required.' });
  }

  if (!allowedStatuses.includes(status) || !allowedPriorities.includes(priority)) {
    return res.status(400).json({ success: false, message: 'Invalid task status or priority.' });
  }

  const project = getProjectDetails(projectId);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  if (project.accessMode === 'Individual') {
    const workspaceMember = project.members.find((member) => member.user.role === 'Member');
    assigneeId = workspaceMember?.user.id ?? assigneeId;
  }

  if (!canManageTask(req.user, projectId)) {
    return res.status(403).json({ success: false, message: 'Only admins can create or assign tasks.' });
  }

  if (assigneeId) {
    const memberExists = get(
      `
        SELECT 1
        FROM project_members
        WHERE project_id = :projectId AND user_id = :assigneeId
      `,
      { projectId, assigneeId }
    );

    if (!memberExists) {
      return res.status(400).json({ success: false, message: 'Assignee must be a member of the project.' });
    }
  }

  const result = run(
    `
      INSERT INTO tasks (
        project_id,
        title,
        description,
        status,
        priority,
        assignee_id,
        created_by,
        due_date
      )
      VALUES (
        :projectId,
        :title,
        :description,
        :status,
        :priority,
        :assigneeId,
        :createdBy,
        :dueDate
      )
    `,
    {
      projectId,
      title,
      description,
      status,
      priority,
      assigneeId,
      createdBy: req.user.id,
      dueDate,
    }
  );

  const createdTaskId = Number(result.lastInsertRowid);
  const assigneeName = assigneeId
    ? project.members.find((member) => member.user.id === assigneeId)?.user.name || 'a member'
    : 'nobody yet';

  addTaskActivity({
    taskId: createdTaskId,
    projectId,
    userId: req.user.id,
    action: 'created',
    details: `Task created with ${priority} priority and assigned to ${assigneeName}.`,
    toStatus: status,
  });

  return res.status(201).json({
    success: true,
    message: 'Task created successfully.',
    data: getTaskDetails(createdTaskId),
  });
};

export const getTasks = async (req, res) => {
  const rows = all(
    `
      SELECT
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        t.project_id,
        t.assignee_id,
        t.created_by,
        t.created_at,
        t.updated_at,
        p.name AS project_name,
        a.id AS assignee_user_id,
        a.name AS assignee_name,
        a.email AS assignee_email,
        a.role AS assignee_role,
        a.created_at AS assignee_created_at,
        c.id AS creator_user_id,
        c.name AS creator_name,
        c.email AS creator_email,
        c.role AS creator_role,
        c.created_at AS creator_created_at
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN users c ON c.id = t.created_by
      LEFT JOIN users a ON a.id = t.assignee_id
      WHERE
        ${req.user.role === 'Admin'
          ? '1 = 1'
          : `EXISTS (
              SELECT 1
              FROM project_members pm
              WHERE pm.project_id = t.project_id AND pm.user_id = ${req.user.id}
            )`}
      ORDER BY
        CASE t.status
          WHEN 'To Do' THEN 1
          WHEN 'In Progress' THEN 2
          ELSE 3
        END,
        t.due_date IS NULL,
        t.due_date ASC
    `
  );

  return res.status(200).json({
    success: true,
    count: rows.length,
    data: rows.map((row) => {
      const task = formatTask(row);
      return {
        ...task,
        permissions: {
          canManage: canManageTask(req.user, task.projectId),
          canUpdateStatus: canUpdateTask(req.user, task),
        },
      };
    }),
  });
};

export const getTaskById = async (req, res) => {
  const taskId = Number(req.params.taskId);
  const task = getTaskDetails(taskId);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }

  const project = getProjectDetails(task.projectId);
  const canView =
    req.user.role === 'Admin' ||
    project?.ownerId === req.user.id ||
    project?.members.some((member) => member.user.id === req.user.id);

  if (!canView) {
    return res.status(403).json({ success: false, message: 'You do not have access to this task.' });
  }

  return res.status(200).json({
    success: true,
    data: {
      ...task,
      permissions: {
        canManage: canManageTask(req.user, task.projectId),
        canUpdateStatus: canUpdateTask(req.user, task),
      },
    },
  });
};

export const updateTask = async (req, res) => {
  const taskId = Number(req.params.taskId);
  const task = getTaskDetails(taskId);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }

  if (!canUpdateTask(req.user, task)) {
    return res.status(403).json({ success: false, message: 'You do not have permission to update this task.' });
  }

  const isManager = canManageTask(req.user, task.projectId);
  const project = getProjectDetails(task.projectId);
  const nextStatus = req.body.status ?? task.status;
  const nextPriority = req.body.priority ?? task.priority;
  const nextTitle = req.body.title?.trim();
  const nextDescription = req.body.description?.trim();
  const nextDueDate = Object.prototype.hasOwnProperty.call(req.body, 'dueDate') ? req.body.dueDate : task.dueDate;
  const nextAssigneeId = Object.prototype.hasOwnProperty.call(req.body, 'assigneeId')
    ? (req.body.assigneeId ? Number(req.body.assigneeId) : null)
    : task.assigneeId;

  if (!allowedStatuses.includes(nextStatus) || !allowedPriorities.includes(nextPriority)) {
    return res.status(400).json({ success: false, message: 'Invalid task status or priority.' });
  }

  if (!isManager) {
    const attemptedFields = ['title', 'description', 'priority', 'dueDate', 'assigneeId'].filter((field) =>
      Object.prototype.hasOwnProperty.call(req.body, field)
    );

    if (attemptedFields.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Members can only update the status of tasks assigned to them.',
      });
    }
  }

  if (isManager && nextAssigneeId) {
    const memberExists = get(
      `
        SELECT 1
        FROM project_members
        WHERE project_id = :projectId AND user_id = :assigneeId
      `,
      { projectId: task.projectId, assigneeId: nextAssigneeId }
    );

    if (!memberExists) {
      return res.status(400).json({ success: false, message: 'Assignee must be a member of the project.' });
    }
  }

  run(
    `
      UPDATE tasks
      SET
        title = :title,
        description = :description,
        status = :status,
        priority = :priority,
        due_date = :dueDate,
        assignee_id = :assigneeId,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = :taskId
    `,
    {
      title: isManager ? nextTitle || task.title : task.title,
      description: isManager ? nextDescription ?? task.description : task.description,
      status: nextStatus,
      priority: isManager ? nextPriority : task.priority,
      dueDate: isManager ? nextDueDate : task.dueDate,
      assigneeId: isManager ? nextAssigneeId : task.assigneeId,
      taskId,
    }
  );

  const activityMessages = [];
  if (task.status !== nextStatus) {
    activityMessages.push({
      action: 'status_changed',
      details: `${req.user.name} moved this task from ${task.status} to ${nextStatus}.`,
      fromStatus: task.status,
      toStatus: nextStatus,
    });
  }

  if (isManager && task.assigneeId !== nextAssigneeId) {
    const previousAssigneeName = task.assignee?.name || 'Unassigned';
    const nextAssigneeName =
      nextAssigneeId
        ? project.members.find((member) => member.user.id === nextAssigneeId)?.user.name || 'a member'
        : 'Unassigned';

    activityMessages.push({
      action: 'reassigned',
      details: `${req.user.name} changed assignee from ${previousAssigneeName} to ${nextAssigneeName}.`,
      fromStatus: task.status,
      toStatus: nextStatus,
    });
  }

  if (isManager && task.priority !== nextPriority) {
    activityMessages.push({
      action: 'priority_changed',
      details: `${req.user.name} changed priority from ${task.priority} to ${nextPriority}.`,
      fromStatus: task.status,
      toStatus: nextStatus,
    });
  }

  if (isManager && task.dueDate !== nextDueDate) {
    activityMessages.push({
      action: 'due_date_changed',
      details: `${req.user.name} updated the due date.`,
      fromStatus: task.status,
      toStatus: nextStatus,
    });
  }

  activityMessages.forEach((activity) =>
    addTaskActivity({
      taskId,
      projectId: task.projectId,
      userId: req.user.id,
      ...activity,
    })
  );

  return res.status(200).json({
    success: true,
    message: 'Task updated successfully.',
    data: getTaskDetails(taskId),
  });
};

export const deleteTask = async (req, res) => {
  const taskId = Number(req.params.taskId);
  const task = getTaskDetails(taskId);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }

  if (!canManageTask(req.user, task.projectId)) {
    return res.status(403).json({ success: false, message: 'Only admins can delete tasks.' });
  }

  run(`DELETE FROM tasks WHERE id = :taskId`, { taskId });

  return res.status(200).json({
    success: true,
    message: 'Task deleted successfully.',
  });
};

export const getProjectTasks = async (req, res) => {
  const projectId = Number(req.params.projectId);
  const project = getProjectDetails(projectId);

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  const canView =
    req.user.role === 'Admin' ||
    project.ownerId === req.user.id ||
    project.members.some((member) => member.user.id === req.user.id);

  if (!canView) {
    return res.status(403).json({ success: false, message: 'You do not have access to this project.' });
  }

  const rows = all(
    `
      SELECT
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        t.project_id,
        t.assignee_id,
        t.created_by,
        t.created_at,
        t.updated_at,
        p.name AS project_name,
        a.id AS assignee_user_id,
        a.name AS assignee_name,
        a.email AS assignee_email,
        a.role AS assignee_role,
        a.created_at AS assignee_created_at,
        c.id AS creator_user_id,
        c.name AS creator_name,
        c.email AS creator_email,
        c.role AS creator_role,
        c.created_at AS creator_created_at
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN users c ON c.id = t.created_by
      LEFT JOIN users a ON a.id = t.assignee_id
      WHERE t.project_id = :projectId
      ORDER BY
        CASE t.status
          WHEN 'To Do' THEN 1
          WHEN 'In Progress' THEN 2
          ELSE 3
        END,
        t.due_date IS NULL,
        t.due_date ASC
    `,
    { projectId }
  );

  return res.status(200).json({
    success: true,
    count: rows.length,
    data: rows.map((row) => {
      const task = formatTask(row);
      return {
        ...task,
        permissions: {
          canManage: canManageTask(req.user, task.projectId),
          canUpdateStatus: canUpdateTask(req.user, task),
        },
      };
    }),
  });
};

export const addTaskComment = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Task comments were removed to keep this assignment focused on project and task tracking.',
  });
};
