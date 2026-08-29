import { Router } from 'express';
import {
  getSlackAuthUrl,
  getSlackStatus,
  saveSlackWebhook,
  disconnectSlack,
  sendTestSlackAlert,
} from '../controllers/slackController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/auth-url', getSlackAuthUrl);
router.get('/status', getSlackStatus);
router.post('/webhook', saveSlackWebhook);
router.post('/disconnect', disconnectSlack);
router.post('/test', sendTestSlackAlert);

export default router;
