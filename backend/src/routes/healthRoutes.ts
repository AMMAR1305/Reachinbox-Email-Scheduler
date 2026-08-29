import { Router } from 'express';
import { getHealthStatus, getQueueStats } from '../controllers/healthController';

const router = Router();

router.get('/health', getHealthStatus);
router.get('/queue-stats', getQueueStats);

export default router;
