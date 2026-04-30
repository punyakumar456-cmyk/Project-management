import jwt from 'jsonwebtoken';
import { formatUser, get, getProjectDetails, getProjectRole, isProjectMember } from '../config/database.js';

const jwtSecret = process.env.JWT_SECRET || 'task-manager-dev-secret';

export const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = get(
      `
        SELECT id, name, email, role, created_at
        FROM users
        WHERE id = :id
      `,
      { id: decoded.id }
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account no longer exists.' });
    }

    req.user = formatUser(user);
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Only ${roles.join('/')} users can perform this action.`,
    });
  }

  next();
};

export const checkProjectMembership = async (req, res, next) => {
  const projectId = Number(req.params.projectId);

  if (!Number.isInteger(projectId)) {
    return res.status(400).json({ success: false, message: 'Invalid project id.' });
  }

  const project = getProjectDetails(projectId);

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  const hasAccess =
    req.user.role === 'Admin' ||
    project.ownerId === req.user.id ||
    isProjectMember(projectId, req.user.id);

  if (!hasAccess) {
    return res.status(403).json({ success: false, message: 'You do not have access to this project.' });
  }

  req.project = project;
  req.projectRole =
    req.user.role === 'Admin'
      ? 'Admin'
      : project.ownerId === req.user.id
        ? 'Admin'
        : getProjectRole(projectId, req.user.id);

  next();
};

export default { protect, authorize, checkProjectMembership };
