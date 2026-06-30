import { Router } from 'express';
import taskRoutes from './taskRoutes';
import plannerRoutes from './plannerRoutes';
import notificationRoutes from './notificationRoutes';
import analyticsRoutes from './analyticsRoutes';
import emergencyRoutes from './emergencyRoutes';
import goalRoutes from './goalRoutes';
import habitRoutes from './habitRoutes';
import calendarRoutes from './calendarRoutes';
import insightRoutes from './insightRoutes';
import coachRoutes from './coachRoutes';
import settingsRoutes from './settingsRoutes';

const router = Router();

// ── Feature routes (Phase 1 backward compatible) ──────────────
router.use('/tasks', taskRoutes);

// ── Versioned routes (Phase 2+) ────────────────────────────────
router.use('/v1/tasks', taskRoutes);
router.use('/v1/planner', plannerRoutes);
router.use('/v1/notifications', notificationRoutes);
router.use('/v1/analytics', analyticsRoutes);
router.use('/v1/emergency', emergencyRoutes);
router.use('/v1/goals', goalRoutes);
router.use('/v1/habits', habitRoutes);
router.use('/v1/calendar', calendarRoutes);
router.use('/v1/insights', insightRoutes);
router.use('/v1/coach', coachRoutes);
router.use('/v1/settings', settingsRoutes);

export default router;
