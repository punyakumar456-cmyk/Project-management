# Database Schema

## Collections

### 1. Users
```javascript
{
  _id: ObjectId,
  name: String (required, max 50),
  email: String (required, unique),
  password: String (hashed, required),
  role: String (enum: ['Admin', 'Member'], default: 'Member'),
  avatar: String (optional),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- email (unique)

---

### 2. Projects
```javascript
{
  _id: ObjectId,
  name: String (required, max 100),
  description: String (max 500),
  owner: ObjectId (ref: User, required),
  members: [
    {
      userId: ObjectId (ref: User),
      role: String (enum: ['Admin', 'Member'], default: 'Member'),
      joinedAt: Date
    }
  ],
  status: String (enum: ['Active', 'On Hold', 'Completed', 'Cancelled'], default: 'Active'),
  dueDate: Date,
  tags: [String],
  isPublic: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- owner
- members.userId

---

### 3. Tasks
```javascript
{
  _id: ObjectId,
  title: String (required, max 100),
  description: String (max 1000),
  project: ObjectId (ref: Project, required),
  assignee: ObjectId (ref: User, optional),
  creator: ObjectId (ref: User, required),
  status: String (enum: ['To Do', 'In Progress', 'Review', 'Done'], default: 'To Do'),
  priority: String (enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium'),
  dueDate: Date,
  estimatedHours: Number (min: 0),
  actualHours: Number (min: 0),
  tags: [String],
  attachments: [
    {
      name: String,
      url: String,
      uploadedAt: Date
    }
  ],
  comments: [
    {
      userId: ObjectId (ref: User),
      text: String,
      createdAt: Date
    }
  ],
  isOverdue: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- project
- assignee
- status
- dueDate

---

## Relationships

```
User (1) ──────── (many) Project (as owner)
User (1) ──────── (many) Project (as member)
User (1) ──────── (many) Task (as assignee)
User (1) ──────── (many) Task (as creator)
User (1) ──────── (many) Comments (in Task)

Project (1) ──────── (many) Task
```

## Data Validation Rules

### Users
- Email must be valid email format
- Password must be at least 6 characters
- Role must be either 'Admin' or 'Member'

### Projects
- Name is required
- Owner must exist
- Members userId must reference valid users
- Status must be one of the defined enums

### Tasks
- Title is required
- Project must exist
- Assignee and creator must be project members or exist
- Priority must be one of the defined levels
- Status must be one of the defined statuses
- isOverdue is automatically calculated:
  - true if dueDate is in the past AND status !== 'Done'
  - false otherwise

## Access Control Rules

### Projects
- Owner has full control
- Members with 'Admin' role can edit/delete/manage members
- Members with 'Member' role can only view/create tasks

### Tasks
- Creator can edit/delete their tasks
- Assignee can update task status and progress
- Project admins can edit/delete any task
- Project members can view all project tasks

## Cascade Actions

- When a project is deleted:
  - All associated tasks are deleted
  - All project members are removed

- When a user is deleted:
  - Their owned projects are reassigned or deleted
  - They are removed from project member lists
  - Tasks assigned to them are unassigned

---

*Note: Implement cascade delete operations carefully in your application logic.*
