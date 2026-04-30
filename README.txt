TASK MANAGER PROJECT

This repository contains:
- task-manager-frontend : React + Vite frontend
- task-manager-backend : Node.js + Express backend

How to run locally

1. Frontend
   - Open terminal in task-manager-frontend
   - Run: npm install
   - Run: npm run dev

2. Backend
   - Open terminal in task-manager-backend
   - Run: npm install
   - Run: npm start

Important notes
- node_modules and build files should not be uploaded to GitHub
- backend .env should stay private
- backend data database file should usually stay out of GitHub unless you intentionally want sample data

How to add this project to GitHub

1. Create a new empty repository on GitHub
2. Open terminal in this folder:
   C:\Users\alywn\Project management
3. Run these commands:

   git init
   git add .
   git commit -m "Initial project upload"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPOSITORY_URL
   git push -u origin main

Example remote command
   git remote add origin https://github.com/your-username/your-repo-name.git

If Git asks for login
- Sign in with your GitHub account
- If password login is not allowed, use a GitHub Personal Access Token

Before pushing again after future changes
   git add .
   git commit -m "Update project"
   git push

If you want, Codex can also help you:
- initialize git here
- create a better README.md
- prepare the exact commands using your GitHub repo link
