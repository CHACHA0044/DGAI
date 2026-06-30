import { Router } from 'express';
import * as plannerController from '../controllers/plannerController';
import { aiRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// GET  /api/v1/planner/today    — Fetch today's schedule (cached unless stale)
router.get('/today', plannerController.getTodayPlan);

// POST /api/v1/planner/generate — Force regenerate today's schedule
router.post('/generate', aiRateLimiter, plannerController.generatePlan);

export default router;
