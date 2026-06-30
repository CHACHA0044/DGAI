import { Router } from 'express';
import * as goalController from '../controllers/goalController';

const router = Router();

router.post('/', goalController.createGoal);
router.get('/', goalController.listGoals);
router.get('/summary', goalController.getGoalsSummary);
router.get('/:id', goalController.getGoalById);
router.put('/:id', goalController.updateGoal);
router.patch('/:id/progress', goalController.updateGoalProgress);
router.delete('/:id', goalController.deleteGoal);

export default router;
