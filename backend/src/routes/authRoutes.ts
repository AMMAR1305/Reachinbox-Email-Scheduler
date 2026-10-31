import { Router } from 'express';
import {
  handleGoogleRedirect,
  handleGoogleCallback,
  handleDevLogin,
  handleEmailPasswordLogin,
  getMe,
  logout,
} from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/google', handleGoogleRedirect);
router.get('/google/callback', handleGoogleCallback);
router.get('/dev-login', handleDevLogin);
router.post('/login', handleEmailPasswordLogin);
// /register is a semantic alias — same handler auto-creates new users
router.post('/register', handleEmailPasswordLogin);
router.get('/me', requireAuth, getMe);
router.post('/logout', requireAuth, logout);

export default router;
