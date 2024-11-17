import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getClientIp } from '../../../utils/ipUtils';

const clientId = process.env.NEXT_PUBLIC_ONEDRIVE_CLIENT_ID!;
const clientSecret = process.env.ONEDRIVE_CLIENT_SECRET!;
const redirectUri = process.env.NEXT_PUBLIC_ONEDRIVE_REDIRECT_URI!;

const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const userEndpoint = 'https://graph.microsoft.com/v1.0/me';

export async function GET() {
  const authorizeUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  authorizeUrl.searchParams.append('client_id', clientId);
  authorizeUrl.searchParams.append('response_type', 'code');
  authorizeUrl.searchParams.append('redirect_uri', redirectUri);
  authorizeUrl.searchParams.append(
    'scope',
    'openid email Files.ReadWrite offline_access User.Read'
  );

  return NextResponse.redirect(authorizeUrl.toString());
}

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  console.log('Received authorization code:', code);

  try {
    // Exchange the code for an access token
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Token Response:', tokenData);

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Failed to get access token:', tokenData.error, tokenData.error_description);
      return NextResponse.json(
        { error: `Failed to get access token: ${tokenData.error_description || 'Unknown error'}` },
        { status: 400 }
      );
    }

    const accessToken = tokenData.access_token;

    // Fetch user info
    const userResponse = await fetch(userEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch user info:', await userResponse.text());
      return NextResponse.json({ error: 'Failed to fetch user info' }, { status: userResponse.status });
    }

    const userData = await userResponse.json();
    console.log('User Info:', userData);

    if (!userData.mail) {
      throw new Error('Failed to retrieve user email');
    }

    // Get client IP and session key
    const clientIp = getClientIp(req);
    const cookies = req.cookies;
    const sessionKey = cookies.get('sessionKey')?.value;

    // Find the authenticated user in Prisma
    const user = await prisma.user.findFirst({
      where: { sessionKey, ipAddress: clientIp },
    });

    if (user) {
      console.log('User found:', user.id);

      await prisma.$transaction(async (prisma) => {
        // Delete any existing OneDrive token for the same email
        const deletedTokens = await prisma.oneDriveToken.deleteMany({
          where: {
            email: userData.mail,
          },
        });

        console.log('Deleted existing tokens:', deletedTokens);

        // Create a new token entry
        const newToken = await prisma.oneDriveToken.create({
          data: {
            userId: user.id,
            accessToken: tokenData.access_token || '',
            refreshToken: tokenData.refresh_token || '',
            email: userData.mail,
          },
        });

        console.log('New token created:', newToken);
      });
    } else {
      console.log('User not found.');
    }

    // Only send the user info and token data back to the client
    return NextResponse.json({
      userInfo: userData,
      tokens: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      },
    });
  } catch (error: any) {
    console.error('Error during authentication:', error);
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
  }
}
