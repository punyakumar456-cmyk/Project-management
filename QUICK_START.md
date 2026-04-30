# Quick Start

## Backend

```bash
cd task-manager-backend
npm install
npm run dev
```

Backend URL: `http://localhost:5600`

## Frontend

```bash
cd task-manager-frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:3000`

## Environment

Optional backend `.env`:

```env
JWT_SECRET=change_this_for_real_projects
JWT_EXPIRE=7d
PORT=5600
NODE_ENV=development
```

## Important

- The database is SQLite and is created automatically
- The first registered user becomes the admin
- If port `5600` is already in use, change `PORT` in the backend environment
