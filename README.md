# Team Task Manager

A full-stack project management application with separate admin and member workspaces. Admins can create projects, assign members, create tasks, monitor activity, and track progress. Members can open only their assigned workspaces, update task status, and collaborate through project discussions.

## Highlights

- Separate `Admin` and `Member` experiences
- Project creation with individual or team access
- Task assignment with title, description, priority, assignee, and due date
- Member-only workspace view unless promoted to project lead
- Admin monitoring with task activity tracking
- Project discussion feed inside each workspace
- SQLite-based backend for simple local setup
- REST API integration between frontend and backend

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Zustand, Axios
- Backend: Node.js, Express, JWT
- Database: SQLite via `node:sqlite`

## Project Structure

```text
task-manager-frontend/
  src/
    components/
    pages/
    store/
    styles/
    utils/

task-manager-backend/
  config/
  controllers/
  middleware/
  routes/
  data/
```

## Roles

### Admin

- Create and manage workspaces
- Add or remove members
- Assign tasks with full details
- Change project status
- Monitor member progress and task activity

### Member

- Open only assigned workspaces
- View only assigned tasks in member mode
- Update task status
- Post project discussion updates

## REST API Areas

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/users`
- `PUT /api/auth/update-profile`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PUT /api/projects/:projectId`
- `DELETE /api/projects/:projectId`
- `POST /api/projects/:projectId/members`
- `DELETE /api/projects/:projectId/members/:userId`
- `POST /api/projects/:projectId/messages`
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:taskId`
- `PUT /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId`
- `GET /api/tasks/project/:projectId`

## Local Setup

### 1. Install dependencies

```bash
cd task-manager-backend
npm install

cd ../task-manager-frontend
npm install
```

### 2. Configure backend environment

Create `task-manager-backend/.env` from `task-manager-backend/.env.example`.

Example:

```env
JWT_SECRET=change_this_for_real_projects
JWT_EXPIRE=7d
PORT=5600
NODE_ENV=development
```

### 3. Start backend

```bash
cd task-manager-backend
npm run dev
```

Backend runs on:

```text
http://localhost:5600
```

### 4. Start frontend

```bash
cd task-manager-frontend
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

## Notes

- The first account created becomes the initial admin.
- Backend `.env`, `node_modules`, build output, and local database files are ignored from Git.
- The SQLite database is created automatically inside `task-manager-backend/data/`.

## GitHub

Repository:

```text
https://github.com/punyakumar456-cmyk/Project-management
```
