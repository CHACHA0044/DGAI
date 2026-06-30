import { Router } from 'express';
import * as emergencyController from '../controllers/emergencyController';
import { aiRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.get('/status', emergencyController.getEmergencyStatus);
router.get('/plan', emergencyController.getEmergencyPlan);
router.post('/toggle', aiRateLimiter, emergencyController.toggleEmergencyMode);

export default router;
