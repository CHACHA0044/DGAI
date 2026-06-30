import { Router } from 'express';
import * as insightController from '../controllers/insightController';

const router = Router();

router.get('/', insightController.getLatestInsights);
router.post('/generate', insightController.generateInsights);

export default router;
