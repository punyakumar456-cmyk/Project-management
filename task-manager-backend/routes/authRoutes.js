import express from 'express';
import { signup, login, getMe, updateProfile, logout, getUsers } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('Admin'), getUsers);
router.put('/update-profile', protect, updateProfile);
router.post('/logout', protect, logout);

export default router;
