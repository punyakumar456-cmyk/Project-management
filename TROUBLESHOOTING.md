# Troubleshooting & FAQ

## Common Issues & Solutions

### 🔴 MongoDB Connection Issues

**Problem**: `MongoDB connection failed` or `ECONNREFUSED`

**Solutions**:
1. **Ensure MongoDB is running**
   ```bash
   # Windows
   mongod
   
   # Mac (with Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. **Check MongoDB URI in .env**
   ```
   # Local MongoDB
   MONGODB_URI=mongodb://localhost:27017/task-manager
   
   # Atlas (cloud)
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task-manager
   ```

3. **Verify MongoDB is accessible**
   ```bash
   mongosh
   # If this works, MongoDB is running
   ```

---

### 🔴 Port Already in Use

**Problem**: `Address already in use :::5000` or `:3000`

**Solutions**:

**Port 5000 (Backend)**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

**Port 3000 (Frontend)**:
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Or change the port**:
```bash
# Backend: Update .env
PORT=5001

# Frontend: Update vite.config.js
server: {
  port: 3001
}
```

---

### 🔴 CORS Error

**Problem**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**: Already handled! The backend has CORS enabled. Make sure:
1. Frontend is running on `http://localhost:3000`
2. Backend is running on `http://localhost:5000`
3. vite.config.js proxy is configured correctly

```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  },
}
```

---

### 🔴 Authentication Issues

**Problem**: `401 Unauthorized` or `Not authorized to access this route`

**Solutions**:
1. **Check token is stored**
   ```javascript
   // In browser console
   localStorage.getItem('token')
   ```

2. **Check token expiration**
   - Default: 7 days
   - Tokens expire and require re-login

3. **Check Authorization header**
   - Must be: `Bearer <token>`
   - Not just: `<token>`

4. **Clear browser cache and localStorage**
   ```javascript
   localStorage.clear()
   location.reload()
   ```

---

### 🔴 Module Not Found Errors

**Problem**: `Cannot find module 'express'` or similar

**Solutions**:
```bash
# Backend
cd task-manager-backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd task-manager-frontend
rm -rf node_modules package-lock.json
npm install
```

---

### 🔴 Database Connection Pool Issues

**Problem**: `MongooseError: connect ECONNREFUSED` with many requests

**Solutions**:
1. **Increase connection pool**
   ```javascript
   // config/database.js
   mongoose.connect(uri, {
     maxPoolSize: 10,
     minPoolSize: 5
   })
   ```

2. **Restart MongoDB**
   ```bash
   mongod --restart
   ```

---

### 🔴 API 404 Errors

**Problem**: `GET /api/projects 404 Not Found`

**Solutions**:
1. **Check backend is running**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Check API endpoint URL**
   - Frontend: `http://localhost:3000` (proxied to backend)
   - Direct: `http://localhost:5000/api/...`

3. **Check route is registered**
   - Verify route exists in `/routes`
   - Verify route is imported in `server.js`

---

### 🔴 Frontend Won't Load

**Problem**: Blank page or white screen

**Solutions**:
1. **Check browser console for errors**
   - Open DevTools (F12)
   - Check Console tab

2. **Clear cache**
   ```bash
   # Hard refresh
   Ctrl+Shift+R (Windows)
   Cmd+Shift+R (Mac)
   ```

3. **Rebuild frontend**
   ```bash
   cd task-manager-frontend
   npm run build
   npm run preview
   ```

---

### 🔴 Password Issues

**Problem**: `Passwords do not match` or can't login

**Solutions**:
1. **Check password requirements**
   - Minimum 6 characters
   - Both password fields must match (on signup)

2. **Reset password**
   - Feature not yet implemented
   - Delete user and create new account

---

### 🔴 Task Won't Update

**Problem**: Task status/details not saving

**Solutions**:
1. **Check you have permission**
   - Creator can edit their tasks
   - Assignee can update status
   - Project admin can edit any

2. **Check form validation**
   - Title is required
   - Project must exist

3. **Check network tab**
   - Verify PUT request succeeds (200/201 status)

---

## 🔍 Debugging Tips

### Enable Detailed Logging

**Backend**:
```javascript
// Add to server.js before routes
import morgan from 'morgan';
app.use(morgan('dev')); // More detailed than 'tiny'
```

**Frontend**:
```javascript
// In utils/api.js
API.interceptors.request.use(config => {
  console.log('Request:', config);
  return config;
});

API.interceptors.response.use(response => {
  console.log('Response:', response);
  return response;
});
```

---

### Check Database

```bash
mongosh
use task-manager
db.users.find().pretty()
db.projects.find().pretty()
db.tasks.find().pretty()
```

---

### View Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Perform action
4. Click request and check:
   - Headers (auth token)
   - Response (data/errors)
   - Status (200, 401, 404, etc)

---

## ❓ FAQs

### Q: How do I change the admin user?

**A**: Update role in database:
```bash
mongosh
use task-manager
db.users.updateOne({ email: 'user@example.com' }, { $set: { role: 'Admin' } })
```

---

### Q: How do I reset all data?

**A**: Delete database and recreate:
```bash
mongosh
use task-manager
db.dropDatabase()
```

---

### Q: Can I use PostgreSQL instead of MongoDB?

**A**: Yes! You'll need to:
1. Update models to use TypeORM or Prisma
2. Change connection string
3. Update schema definitions

---

### Q: How do I add more fields to User?

**A**: Update the User model:
```javascript
// models/User.js
const userSchema = new mongoose.Schema({
  // existing fields...
  phone: String,
  department: String
});
```

---

### Q: How do I deploy to production?

**A**: Key steps:
1. Use `.env` for secrets (not in code)
2. Enable HTTPS
3. Set up proper database backups
4. Use environment-specific configs
5. Set `NODE_ENV=production`
6. Use a process manager (PM2, systemd)

---

### Q: How do I handle file uploads?

**A**: Task model has attachments array. To implement:
1. Add middleware: `npm install multer`
2. Create upload route
3. Save file and store URL in task

---

### Q: How do I add email notifications?

**A**: Add to any route:
```bash
npm install nodemailer
```

Then send emails on task events:
```javascript
const transporter = nodemailer.createTransport({...});
await transporter.sendMail({to, subject, html});
```

---

### Q: How do I implement real-time updates?

**A**: Use WebSockets:
```bash
npm install socket.io
```

Then emit events when tasks are updated.

---

## 🆘 Getting Help

1. **Check this guide** - Most issues are covered
2. **Check browser console** - Look for error messages
3. **Check network tab** - Verify API responses
4. **Check MongoDB** - Verify data exists
5. **Restart services** - Often fixes connection issues

---

## 📊 Performance Tips

### Backend Optimization
- Enable query caching
- Add database indexes (already done)
- Use pagination for large datasets
- Compress responses with gzip

### Frontend Optimization
- Code splitting by route
- Lazy load components
- Optimize images
- Use production build

---

## 🔐 Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use HTTPS in production
- [ ] Enable CORS only for your domain
- [ ] Use environment variables
- [ ] Don't commit .env files
- [ ] Validate all user inputs
- [ ] Use strong database passwords
- [ ] Enable MongoDB authentication

---

## 📞 Still Need Help?

1. Check the README.md for overview
2. Review DATABASE_SCHEMA.md for data structure
3. Check API_TESTING.md for endpoint details
4. Look at source code comments
5. Check error messages carefully

---

**Happy debugging!** 🐛 → 🚀
