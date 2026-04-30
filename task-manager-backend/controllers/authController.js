import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { all, formatUser, get, run } from '../config/database.js';

const jwtSecret = process.env.JWT_SECRET || 'task-manager-dev-secret';
const jwtExpire = process.env.JWT_EXPIRE || '7d';

const hashPassword = (password) =>
  crypto.pbkdf2Sync(password, 'task-manager-salt', 100000, 64, 'sha512').toString('hex');

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpire });

const normalizeRole = (role) => (role === 'Admin' ? 'Admin' : 'Member');
const sanitizeUser = (row) => formatUser(row);

export const signup = async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  const passwordConfirm = req.body.passwordConfirm;
  const selectedRole = normalizeRole(req.body.role);

  if (!name || !email || !password || !passwordConfirm) {
    return res.status(400).json({ success: false, message: 'Name, email, password, and confirmation are required.' });
  }

  if (password !== passwordConfirm) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  const existingUser = get(`SELECT id FROM users WHERE email = :email`, { email });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
  }

  const adminCount = get(`SELECT COUNT(*) AS count FROM users WHERE role = 'Admin'`);
  const role = selectedRole === 'Admin' && adminCount.count === 0 ? 'Admin' : 'Member';

  if (selectedRole === 'Admin' && adminCount.count > 0) {
    return res.status(403).json({
      success: false,
      message: 'An admin already exists. New users should register as members.',
    });
  }

  const result = run(
    `
      INSERT INTO users (name, email, password_hash, role)
      VALUES (:name, :email, :passwordHash, :role)
    `,
    {
      name,
      email,
      passwordHash: hashPassword(password),
      role,
    }
  );

  const user = get(
    `
      SELECT id, name, email, role, created_at, last_login_at
      FROM users
      WHERE id = :id
    `,
    { id: result.lastInsertRowid }
  );

  return res.status(201).json({
    success: true,
    message: role === 'Admin' ? 'Admin workspace created successfully.' : 'Member account created successfully.',
    token: generateToken(user),
    user: sanitizeUser(user),
  });
};

export const login = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  const selectedRole = normalizeRole(req.body.role);

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = get(`SELECT * FROM users WHERE email = :email`, { email });
  if (!user || user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (selectedRole && user.role !== selectedRole) {
    return res.status(403).json({
      success: false,
      message: `This account belongs to the ${user.role} portal. Please switch tabs and try again.`,
    });
  }

  run(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = :id`, { id: user.id });

  const refreshedUser = get(
    `
      SELECT id, name, email, role, created_at, last_login_at
      FROM users
      WHERE id = :id
    `,
    { id: user.id }
  );

  return res.status(200).json({
    success: true,
    message: `${user.role} logged in successfully.`,
    token: generateToken(refreshedUser),
    user: sanitizeUser(refreshedUser),
  });
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
};

export const getUsers = async (req, res) => {
  const users = all(
    `
      SELECT id, name, email, role, created_at, last_login_at
      FROM users
      ORDER BY CASE role WHEN 'Admin' THEN 0 ELSE 1 END, name ASC
    `
  );

  return res.status(200).json({
    success: true,
    data: users.map((user) => sanitizeUser(user)),
  });
};

export const updateProfile = async (req, res) => {
  const name = req.body.name?.trim();

  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required.' });
  }

  run(`UPDATE users SET name = :name WHERE id = :id`, { name, id: req.user.id });

  const updatedUser = get(
    `
      SELECT id, name, email, role, created_at, last_login_at
      FROM users
      WHERE id = :id
    `,
    { id: req.user.id }
  );

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: sanitizeUser(updatedUser),
  });
};

export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};
