import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../../../lib/prisma';
import { getClientIp } from '../../../utils/ipUtils';

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;

const oAuth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

export async function GET() {
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/drive',
    ],
    prompt: 'consent',
  });
  return NextResponse.redirect(authorizeUrl);
}

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo.email) {
      throw new Error('Failed to retrieve user email');
    }

    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    const { data: driveData } = await drive.files.list({
      q: "trashed = false and 'me' in owners",
      fields: 'files(id, name, mimeType, parents)',
    });

    const about = await drive.about.get({
      fields: 'storageQuota',
    });

    const storageQuota = about.data.storageQuota;

    console.log('User Info:', userInfo);
    console.log('Drive Data:', driveData);
    console.log('Storage Quota:', storageQuota);

    // Get client IP
    const clientIp = getClientIp(req);
    const cookies = req.cookies;
    const sessionKey = cookies.get('sessionKey')?.value;

    // Find the authenticated user
    const user = await prisma.user.findFirst({
      where: { sessionKey, ipAddress: clientIp },
    });

    if (user) {
      await prisma.$transaction(async (prisma) => {
        // Delete any existing Google token for the same email
        const deletedTokens = await prisma.token.deleteMany({
          where: {
            email: userInfo.email!,
          },
        });

        console.log('Deleted existing tokens:', deletedTokens);

        // Create a new token entry
        const newToken = await prisma.token.create({
          data: {
            userId: user.id,
            accessToken: tokens.access_token || '',
            refreshToken: tokens.refresh_token || '',
            email: userInfo.email!,
          },
        });

        console.log('New token created:', newToken);
      });
    } else {
      console.log('User not found.');
    }

    return NextResponse.json({
      userInfo,
      driveData,
      storageQuota,
      driveType: 'google',  // Add driveType field
    });
  } catch (error: any) {
    if (error.response?.data?.error === 'invalid_grant') {
      console.error('Invalid grant error:', error);
      return NextResponse.json({ error: 'Invalid grant: authorization code expired or already used' }, { status: 400 });
    } else {
      console.error('Error during authentication:', error);
      return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
    }
  }
}
