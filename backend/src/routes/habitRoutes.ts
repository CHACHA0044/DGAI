import { Router } from 'express';
import * as habitController from '../controllers/habitController';

const router = Router();

router.post('/', habitController.createHabit);
router.get('/', habitController.listHabits);
router.get('/summary', habitController.getHabitsSummary);
router.get('/:id', habitController.getHabitById);
router.put('/:id', habitController.updateHabit);
router.post('/:id/complete', habitController.completeHabit);
router.delete('/:id', habitController.deleteHabit);

export default router;
