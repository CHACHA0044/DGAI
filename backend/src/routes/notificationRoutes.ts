import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';

const router = Router();

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.post('/read-all', notificationController.markAllAsRead);

export default router;
