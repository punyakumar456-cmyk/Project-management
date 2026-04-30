# API Testing with cURL

### 1. Authentication

#### Sign Up
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "passwordConfirm": "password123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Store the returned token for authenticated requests.

#### Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 2. Projects

#### Create Project
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Website Redesign",
    "description": "Redesign company website",
    "dueDate": "2024-12-31",
    "isPublic": false,
    "tags": ["frontend", "important"]
  }'
```

#### Get All Projects
```bash
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Single Project
```bash
curl -X GET http://localhost:5000/api/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update Project
```bash
curl -X PUT http://localhost:5000/api/projects/PROJECT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Website Redesign v2",
    "status": "In Progress"
  }'
```

#### Delete Project
```bash
curl -X DELETE http://localhost:5000/api/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Add Project Member
```bash
curl -X POST http://localhost:5000/api/projects/PROJECT_ID/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "USER_ID",
    "role": "Member"
  }'
```

#### Remove Project Member
```bash
curl -X DELETE http://localhost:5000/api/projects/PROJECT_ID/members/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Tasks

#### Create Task
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Create homepage design",
    "description": "Design the homepage mockup",
    "project": "PROJECT_ID",
    "assignee": "USER_ID",
    "priority": "High",
    "dueDate": "2024-11-30",
    "estimatedHours": 8,
    "tags": ["design"]
  }'
```

#### Get All Tasks
```bash
curl -X GET http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Tasks with Filters
```bash
curl -X GET "http://localhost:5000/api/tasks?status=In%20Progress&priority=High" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Single Task
```bash
curl -X GET http://localhost:5000/api/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update Task
```bash
curl -X PUT http://localhost:5000/api/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "In Progress",
    "actualHours": 4
  }'
```

#### Delete Task
```bash
curl -X DELETE http://localhost:5000/api/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Project Tasks
```bash
curl -X GET http://localhost:5000/api/tasks/project/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Project Tasks by Status
```bash
curl -X GET "http://localhost:5000/api/tasks/project/PROJECT_ID?status=Done" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Add Task Comment
```bash
curl -X POST http://localhost:5000/api/tasks/TASK_ID/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "Great progress on this task!"
  }'
```

---

### Helper Script

Save as `test-api.sh`:

```bash
#!/bin/bash

# Set your backend URL
API_URL="http://localhost:5000/api"

# Test health
echo "Testing API health..."
curl $API_URL/health

# Login
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"

# Get projects
echo "Getting projects..."
curl -s -X GET $API_URL/projects \
  -H "Authorization: Bearer $TOKEN" | json_pp
```

Run with: `bash test-api.sh`

---

### Response Format

All responses follow this format:

**Success (2xx)**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "count": 0
}
```

**Error (4xx, 5xx)**:
```json
{
  "success": false,
  "message": "Error description"
}
```

---

*Tip: Use Postman or Insomnia for easier API testing with GUI interface*
