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
  console.log('[Google Auth] Exchanging authorization code with Google...');
  
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  let googleId = '';
  let email = '';
  let name = '';
  let avatar: string | null = null;

  // 1. Extract from Google ID Token
  if (tokens.id_token) {
    const decoded: any = jwt.decode(tokens.id_token);
    if (decoded && decoded.email) {
      googleId = decoded.sub || `google_${decoded.email}`;
      email = decoded.email.trim().toLowerCase();
      name = decoded.name || decoded.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      avatar = decoded.picture || null;
      console.log(`[Google Auth] Successfully identified Google user from ID Token: ${name} <${email}>`);
    }
  }

  // 2. Fallback to Google UserInfo API if needed
  if (!email && tokens.access_token) {
    const profileRes = await axios.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    googleId = profileRes.data.sub || `google_${profileRes.data.email}`;
    email = (profileRes.data.email || '').trim().toLowerCase();
    name = profileRes.data.name || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    avatar = profileRes.data.picture || null;
    console.log(`[Google Auth] Successfully identified Google user from userinfo API: ${name} <${email}>`);
  }

  if (!email) {
    throw new Error('Google OAuth failed: User email could not be extracted from Google');
  }

  // Upsert User in PostgreSQL with their real Google name, email, and avatar
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      googleId,
      name,
      avatar: avatar || undefined,
    },
    create: {
      googleId,
      email,
      name,
      avatar,
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
