import { Router } from 'express';
import multer from 'multer';
import {
  scheduleEmail,
  getScheduledEmails,
  getSentEmails,
  getEmailById,
  cancelScheduledEmail,
  searchEmails,
  parseRecipientsFile,
} from '../controllers/emailController';
import { requireAuth } from '../middleware/authMiddleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

router.use(requireAuth);

router.post('/schedule', scheduleEmail);
router.get('/scheduled', getScheduledEmails);
router.get('/sent', getSentEmails);
router.get('/search', searchEmails);
router.post('/parse-recipients', upload.single('file'), parseRecipientsFile);
router.get('/:id', getEmailById);
router.delete('/scheduled/:id', cancelScheduledEmail);

export default router;
