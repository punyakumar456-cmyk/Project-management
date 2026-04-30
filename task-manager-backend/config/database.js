import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databaseDirectory = path.join(process.cwd(), 'data');
const databasePath = path.join(databaseDirectory, 'task-manager.db');

fs.mkdirSync(databaseDirectory, { recursive: true });

const db = new DatabaseSync(databasePath);

const hasColumn = (tableName, columnName) =>
  db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all()
    .some((column) => column.name === columnName);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Member')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Planning'
      CHECK (status IN ('Planning', 'Active', 'Completed')),
    due_date TEXT,
    owner_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS project_members (
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'Member' CHECK (role IN ('Admin', 'Member')),
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'To Do'
      CHECK (status IN ('To Do', 'In Progress', 'Done')),
    priority TEXT NOT NULL DEFAULT 'Medium'
      CHECK (priority IN ('Low', 'Medium', 'High')),
    assignee_id INTEGER,
    created_by INTEGER NOT NULL,
    due_date TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS project_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS task_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    from_status TEXT,
    to_status TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

if (!hasColumn('users', 'last_login_at')) {
  db.exec(`ALTER TABLE users ADD COLUMN last_login_at TEXT`);
}

if (!hasColumn('projects', 'access_mode')) {
  db.exec(`ALTER TABLE projects ADD COLUMN access_mode TEXT NOT NULL DEFAULT 'Team'`);
}

if (!hasColumn('projects', 'team_name')) {
  db.exec(`ALTER TABLE projects ADD COLUMN team_name TEXT`);
}

export const connectDB = async () => {
  console.log(`SQLite database ready at ${databasePath}`);
  return db;
};

export const all = (sql, params = {}) => db.prepare(sql).all(params);
export const get = (sql, params = {}) => db.prepare(sql).get(params);
export const run = (sql, params = {}) => db.prepare(sql).run(params);

export const formatUser = (row) =>
  row
    ? {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        createdAt: row.created_at,
        lastLoginAt: row.last_login_at ?? null,
      }
    : null;

export const getProjectMembers = (projectId) =>
  all(
    `
      SELECT
        pm.role,
        u.id,
        u.name,
        u.email,
        u.role AS account_role,
        u.created_at,
        u.last_login_at
      FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = :projectId
      ORDER BY CASE pm.role WHEN 'Admin' THEN 0 ELSE 1 END, u.name
    `,
    { projectId }
  ).map((member) => ({
    role: member.role,
    user: formatUser({
      ...member,
      role: member.account_role,
    }),
  }));

export const getProjectMessages = (projectId) =>
  all(
    `
      SELECT
        pm.id,
        pm.message,
        pm.created_at,
        u.id AS user_id,
        u.name,
        u.email,
        u.role,
        u.created_at AS user_created_at,
        u.last_login_at
      FROM project_messages pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = :projectId
      ORDER BY pm.created_at ASC
    `,
    { projectId }
  ).map((message) => ({
    id: message.id,
    message: message.message,
    createdAt: message.created_at,
    user: formatUser({
      id: message.user_id,
      name: message.name,
      email: message.email,
      role: message.role,
      created_at: message.user_created_at,
      last_login_at: message.last_login_at,
    }),
  }));

export const formatTaskActivity = (row) =>
  row
    ? {
        id: row.id,
        action: row.action,
        details: row.details || '',
        fromStatus: row.from_status || null,
        toStatus: row.to_status || null,
        createdAt: row.created_at,
        user: formatUser({
          id: row.user_id,
          name: row.user_name,
          email: row.user_email,
          role: row.user_role,
          created_at: row.user_created_at,
          last_login_at: row.user_last_login_at,
        }),
        task: row.task_id
          ? {
              id: row.task_id,
              title: row.task_title,
            }
          : null,
      }
    : null;

export const getTaskActivities = (taskId) =>
  all(
    `
      SELECT
        ta.id,
        ta.action,
        ta.details,
        ta.from_status,
        ta.to_status,
        ta.created_at,
        ta.task_id,
        t.title AS task_title,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role,
        u.created_at AS user_created_at,
        u.last_login_at AS user_last_login_at
      FROM task_activities ta
      JOIN users u ON u.id = ta.user_id
      JOIN tasks t ON t.id = ta.task_id
      WHERE ta.task_id = :taskId
      ORDER BY ta.created_at DESC, ta.id DESC
    `,
    { taskId }
  ).map((activity) => formatTaskActivity(activity));

export const getProjectActivity = (projectId, limit = 30) =>
  all(
    `
      SELECT
        ta.id,
        ta.action,
        ta.details,
        ta.from_status,
        ta.to_status,
        ta.created_at,
        ta.task_id,
        t.title AS task_title,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role,
        u.created_at AS user_created_at,
        u.last_login_at AS user_last_login_at
      FROM task_activities ta
      JOIN users u ON u.id = ta.user_id
      JOIN tasks t ON t.id = ta.task_id
      WHERE ta.project_id = :projectId
      ORDER BY ta.created_at DESC, ta.id DESC
      LIMIT :limit
    `,
    { projectId, limit }
  ).map((activity) => formatTaskActivity(activity));

export const addTaskActivity = ({ taskId, projectId, userId, action, details = '', fromStatus = null, toStatus = null }) =>
  run(
    `
      INSERT INTO task_activities (task_id, project_id, user_id, action, details, from_status, to_status)
      VALUES (:taskId, :projectId, :userId, :action, :details, :fromStatus, :toStatus)
    `,
    {
      taskId,
      projectId,
      userId,
      action,
      details,
      fromStatus,
      toStatus,
    }
  );

export const getProjectRecord = (projectId) =>
  get(
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
      WHERE p.id = :projectId
    `,
    { projectId }
  );

export const formatProject = (row) => {
  if (!row) {
    return null;
  }

  const members = getProjectMembers(row.id);

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    dueDate: row.due_date,
    ownerId: row.owner_id,
    accessMode: row.access_mode || 'Team',
    teamName: row.team_name || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    owner: formatUser({
      id: row.owner_user_id,
      name: row.owner_name,
      email: row.owner_email,
      role: row.owner_role,
      created_at: row.owner_created_at,
      last_login_at: row.owner_last_login_at,
    }),
    members,
    messages: getProjectMessages(row.id),
    activity: getProjectActivity(row.id),
  };
};

export const getProjectDetails = (projectId) => formatProject(getProjectRecord(projectId));

export const isProjectMember = (projectId, userId) =>
  Boolean(
    get(
      `
        SELECT 1
        FROM project_members
        WHERE project_id = :projectId AND user_id = :userId
      `,
      { projectId, userId }
    )
  );

export const getProjectRole = (projectId, userId) => {
  const record = get(
    `
      SELECT role
      FROM project_members
      WHERE project_id = :projectId AND user_id = :userId
    `,
    { projectId, userId }
  );

  return record?.role ?? null;
};

export const getTaskRecord = (taskId) =>
  get(
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
        p.access_mode AS project_access_mode,
        p.team_name AS project_team_name,
        a.id AS assignee_user_id,
        a.name AS assignee_name,
        a.email AS assignee_email,
        a.role AS assignee_role,
        a.created_at AS assignee_created_at,
        a.last_login_at AS assignee_last_login_at,
        c.id AS creator_user_id,
        c.name AS creator_name,
        c.email AS creator_email,
        c.role AS creator_role,
        c.created_at AS creator_created_at,
        c.last_login_at AS creator_last_login_at
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      JOIN users c ON c.id = t.created_by
      LEFT JOIN users a ON a.id = t.assignee_id
      WHERE t.id = :taskId
    `,
    { taskId }
  );

export const formatTask = (row) => {
  if (!row) {
    return null;
  }

  const overdue =
    row.due_date &&
    new Date(row.due_date).getTime() < Date.now() &&
    row.status !== 'Done';

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    projectId: row.project_id,
    assigneeId: row.assignee_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isOverdue: Boolean(overdue),
    project: {
      id: row.project_id,
      name: row.project_name,
      accessMode: row.project_access_mode || 'Team',
      teamName: row.project_team_name || '',
    },
    assignee: row.assignee_user_id
      ? formatUser({
          id: row.assignee_user_id,
          name: row.assignee_name,
          email: row.assignee_email,
          role: row.assignee_role,
          created_at: row.assignee_created_at,
          last_login_at: row.assignee_last_login_at,
        })
      : null,
    creator: formatUser({
      id: row.creator_user_id,
      name: row.creator_name,
      email: row.creator_email,
      role: row.creator_role,
      created_at: row.creator_created_at,
      last_login_at: row.creator_last_login_at,
    }),
    activity: getTaskActivities(row.id),
  };
};

export const getTaskDetails = (taskId) => formatTask(getTaskRecord(taskId));

export default connectDB;
