import { Router } from 'express';
import * as calendarController from '../controllers/calendarController';

const router = Router();

router.post('/events', calendarController.createCalendarEvent);
router.get('/events', calendarController.listCalendarEvents);
router.put('/events/:id', calendarController.updateCalendarEvent);
router.delete('/events/:id', calendarController.deleteCalendarEvent);
router.get('/free-slots', calendarController.findFreeSlots);
router.get('/conflicts', calendarController.checkConflicts);
router.post('/sync-planner', calendarController.syncPlanner);

export default router;
