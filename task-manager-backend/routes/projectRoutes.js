import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  addProjectMessage,
} from '../controllers/projectController.js';
import { protect, checkProjectMembership } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:projectId', checkProjectMembership, getProjectById);
router.put('/:projectId', checkProjectMembership, updateProject);
router.delete('/:projectId', deleteProject);

// Project members routes
router.post('/:projectId/members', checkProjectMembership, addProjectMember);
router.delete('/:projectId/members/:userId', checkProjectMembership, removeProjectMember);
router.post('/:projectId/messages', checkProjectMembership, addProjectMessage);

export default router;
