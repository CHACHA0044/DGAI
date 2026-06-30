import { Router } from 'express';
import * as coachController from '../controllers/coachController';

const router = Router();

router.get('/advice', coachController.getCoachingAdvice);

export default router;
