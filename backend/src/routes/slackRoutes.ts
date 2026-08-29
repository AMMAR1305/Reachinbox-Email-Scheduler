import { Router } from 'express';
import {
  getSlackAuthUrl,
  redirectToSlackOAuth,
  getSlackStatus,
  saveSlackWebhook,
  connectSlack,
  handleSlackOAuthCallback,
  disconnectSlack,
  sendTestSlackAlert,
} from '../controllers/slackController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// OAuth callback from Slack (does not use requireAuth since it's a browser redirect)
router.get('/callback', handleSlackOAuthCallback);

// Protected routes (require JWT authentication)
router.use(requireAuth);

router.get('/auth-url', getSlackAuthUrl);
router.get('/connect', redirectToSlackOAuth);
router.get('/status', getSlackStatus);
router.post('/connect', connectSlack);
router.post('/webhook', saveSlackWebhook);
router.post('/disconnect', disconnectSlack);
router.post('/test', sendTestSlackAlert);

export default router;


