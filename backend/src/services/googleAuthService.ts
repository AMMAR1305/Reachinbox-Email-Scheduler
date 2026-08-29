import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { prisma } from '../db/prisma';

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const googleCallbackUrl =
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
const jwtSecret = process.env.JWT_SECRET || 'reachinbox_secret';

export function getOAuth2Client(): OAuth2Client {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID || '',
    process.env.GOOGLE_CLIENT_SECRET || '',
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  );
}

export function getGoogleAuthUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'select_account consent',
  });
}

export async function processGoogleCallback(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

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
