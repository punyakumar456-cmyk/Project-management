# Team Task Manager

A full-stack task management app for teams to create projects, assign tasks, and track progress with role-based access.

## What It Includes

- Authentication with signup and login
- Role-based access with `Admin` and `Member`
- Project creation and team management
- Task assignment and status tracking
- Dashboard with open, completed, and overdue task visibility
- Embedded SQLite database for easy local setup

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: SQLite via Node's built-in `node:sqlite`
- Auth: JWT

## Project Structure

```text
task-manager-backend/
  config/
  controllers/
  middleware/
  routes/
  data/                 # created automatically for SQLite

task-manager-frontend/
  src/
    components/
    pages/
    store/
    styles/
    utils/
```

## Quick Start

### 1. Install dependencies

```bash
cd task-manager-backend
npm install

cd ../task-manager-frontend
npm install
```

### 2. Optional backend environment file

Create `task-manager-backend/.env` from `.env.example`.

Example:

```env
JWT_SECRET=change_this_for_real_projects
JWT_EXPIRE=7d
PORT=5600
NODE_ENV=development
```

### 3. Start the backend

```bash
cd task-manager-backend
npm run dev
```

The API runs on `http://localhost:5600`.

### 4. Start the frontend

```bash
cd task-manager-frontend
npm run dev
```

The app runs on `http://localhost:3000`.

## Default Role Behavior

- The first signed-up user becomes `Admin`
- Every user after that becomes `Member`

## Permissions

### Admin

- Create, update, and delete projects
- Add or remove project members
- Create, assign, update, and delete tasks

### Member

- View projects they belong to
- View project tasks
- Update the status of tasks assigned to them

## Main API Areas

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/update-profile`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `POST /api/projects/:projectId/members`
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/project/:projectId`
- `PUT /api/tasks/:taskId`

## Notes

- The SQLite database file is created automatically under `task-manager-backend/data/`
- Port `5600` must be free for the backend unless you override `PORT`
- Some older generated documentation files in the repo may not reflect the new SQLite-based setup
