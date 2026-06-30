import { Router } from 'express';
import * as taskController from '../controllers/taskController';
import { validateRequest } from '../middlewares/validateRequest';
import { aiRateLimiter } from '../middlewares/rateLimiter';
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
  taskListQuerySchema,
} from '../validators/taskValidator';

const router = Router();

// POST   /api/tasks             — Create + AI-analyze a new task
router.post(
  '/',
  aiRateLimiter,
  validateRequest(createTaskSchema),
  taskController.createTask
);

// GET    /api/tasks             — List tasks (paginated, filterable)
router.get(
  '/',
  validateRequest(taskListQuerySchema),
  taskController.getTasks
);

// GET    /api/tasks/:id         — Get a single task
router.get(
  '/:id',
  validateRequest(taskIdSchema),
  taskController.getTask
);

// PATCH  /api/tasks/:id         — Update task fields
router.patch(
  '/:id',
  validateRequest(updateTaskSchema),
  taskController.updateTask
);

// DELETE /api/tasks/:id         — Delete a task
router.delete(
  '/:id',
  validateRequest(taskIdSchema),
  taskController.deleteTask
);

// POST   /api/tasks/:id/analyze — Re-run AI analysis on existing task
router.post(
  '/:id/analyze',
  aiRateLimiter,
  validateRequest(taskIdSchema),
  taskController.analyzeTask
);

// POST   /api/tasks/reprioritize — Manual relative task prioritization
router.post(
  '/reprioritize',
  aiRateLimiter,
  taskController.reprioritizeTasks
);

export default router;
