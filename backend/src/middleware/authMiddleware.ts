import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken } from '../services/googleAuthService';
import { prisma } from '../db/prisma';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    googleId: string;
    email: string;
    name: string;
    avatar: string | null;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let token = req.cookies?.auth_token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Please login with Google.',
      });
    }

    const decoded = verifyJwtToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired authentication session.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        googleId: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authenticated user profile not found.',
      });
    }

    req.user = user;
    next();
  } catch (error: any) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Session invalid or expired. Please re-authenticate.',
    });
  }
}
