import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { prisma } from '../db/prisma';

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const googleCallbackUrl =
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
const jwtSecret = process.env.JWT_SECRET || 'reachinbox_secret';

export const oAuth2Client = new OAuth2Client(
  googleClientId,
  googleClientSecret,
  googleCallbackUrl
);

export function getGoogleAuthUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  if (googleClientId && !googleClientId.startsWith('mock-')) {
    return oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'select_account consent',
    });
  }

  // Real Google OAuth URL with prompt so user sees Google authentication
  const clientId = googleClientId || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    googleCallbackUrl
  )}&response_type=code&scope=${encodeURIComponent(
    scopes.join(' ')
  )}&access_type=offline&prompt=select_account%20consent`;
}

export async function processGoogleCallback(code: string) {
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  // Fetch Google User Profile
  const profileRes = await axios.get(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }
  );

  const { sub: googleId, email, name, picture: avatar } = profileRes.data;

  if (!email) {
    throw new Error('Google OAuth failed: User email not provided by Google');
  }

  // Upsert User in PostgreSQL
  const user = await prisma.user.upsert({
    where: { googleId },
    update: {
      email,
      name: name || email.split('@')[0],
      avatar: avatar || null,
    },
    create: {
      googleId,
      email,
      name: name || email.split('@')[0],
      avatar: avatar || null,
    },
  });

  // Generate authenticated JWT
  const sessionToken = generateJwtToken(user.id);

  return { user, sessionToken };
}

export function generateJwtToken(userId: string): string {
  return jwt.sign({ userId }, jwtSecret, { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): { userId: string } {
  return jwt.verify(token, jwtSecret) as { userId: string };
}
