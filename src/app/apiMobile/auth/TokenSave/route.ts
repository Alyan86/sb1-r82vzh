import { NextRequest, NextResponse } from 'next/server';  
import prisma from '../../../lib/prisma';
import { OAuth2Client } from 'google-auth-library';

// Google OAuth Details
const googleClientId = process.env.FIREBASE_CLIENT_ID!;
const googleClientSecret = process.env.FIREBASE_CLIENT_SECRET!;
const googleRedirectUri = 'https://epicbytes.me/';

// OneDrive OAuth Details
const oneDriveClientId = process.env.NEXT_PUBLIC_ONEDRIVE_CLIENT_ID!;
const oneDriveClientSecret = process.env.ONEDRIVE_CLIENT_SECRET!;
const oneDriveRedirectUri = process.env.NEXT_PUBLIC_ONEDRIVE_REDIRECT_URI!;
const oneDriveTokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const oneDriveUserEndpoint = 'https://graph.microsoft.com/v1.0/me';

// Dropbox OAuth Details
const dropboxAppKey = process.env.DROPBOX_APP_KEY!;
const dropboxAppSecret = process.env.DROPBOX_APP_SECRET!;
const dropboxRedirectUri = process.env.DROPBOX_REDIRECT_URI!;
const dropboxTokenEndpoint = 'https://api.dropboxapi.com/oauth2/token';
const dropboxUserEndpoint = 'https://api.dropboxapi.com/2/users/get_current_account';

const googleOAuth2Client = new OAuth2Client(googleClientId, googleClientSecret, googleRedirectUri);

// The function that will handle the token exchange
export async function POST(req: NextRequest) {
    const { uuid, authCode, driveType } = await req.json();
    let accessToken = '';
    let refreshToken = '';
    let email = '';

    try {
        if (driveType === 'google') {
            // Google OAuth2 process
            const { tokens } = await googleOAuth2Client.getToken(authCode);
            accessToken = tokens.access_token || '';
            refreshToken = tokens.refresh_token || '';
            googleOAuth2Client.setCredentials(tokens);

            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                method: 'GET',
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!userInfoResponse.ok) throw new Error('Failed to fetch user info from Google');
            const userInfo = await userInfoResponse.json();
            email = userInfo.email;

        } else if (driveType === 'onedrive') {
            // OneDrive OAuth2 process
            const tokenResponse = await fetch(oneDriveTokenEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: oneDriveClientId,
                    client_secret: oneDriveClientSecret,
                    code: authCode,
                    redirect_uri: oneDriveRedirectUri,
                    grant_type: 'authorization_code',
                }),
            });

            const tokenData = await tokenResponse.json();
            if (!tokenResponse.ok || !tokenData.access_token) throw new Error('Failed to get OneDrive access token');

            accessToken = tokenData.access_token;
            refreshToken = tokenData.refresh_token;

            const userResponse = await fetch(oneDriveUserEndpoint, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!userResponse.ok) throw new Error('Failed to fetch user info from OneDrive');
            const userData = await userResponse.json();
            email = userData.mail;

        } else if (driveType === 'dropbox') {
            // Dropbox OAuth2 process with offline access to get refresh token
            const tokenResponse = await fetch(dropboxTokenEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code: authCode,
                    grant_type: 'authorization_code',
                    client_id: dropboxAppKey,
                    client_secret: dropboxAppSecret,
                    redirect_uri: dropboxRedirectUri,
                }),
            });
            

            const tokenData = await tokenResponse.json();
            console.log('Dropbox Token Response:', tokenData); // Debugging response

            if (!tokenResponse.ok || !tokenData.access_token) {
                throw new Error('Failed to get Dropbox access token');
            }

            // Ensure the refresh token is returned
            if (!tokenData.refresh_token) {
                throw new Error('Refresh token not returned from Dropbox');
            }

            accessToken = tokenData.access_token;
            refreshToken = tokenData.refresh_token;

            const userResponse = await fetch(dropboxUserEndpoint, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!userResponse.ok) throw new Error('Failed to fetch user info from Dropbox');
            const userInfo = await userResponse.json();
            email = userInfo.email;

        } else {
            return NextResponse.json({ error: 'Invalid driveType' }, { status: 400 });
        }

        // Find the user by UUID
        const user = await prisma.user.findUnique({ where: { uuid } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Use a transaction to ensure data integrity
        await prisma.$transaction(async (prisma) => {
            if (driveType === 'google') {
                await prisma.token.deleteMany({ where: { email } });
                await prisma.token.create({
                    data: { userId: user.id, accessToken, refreshToken, email },
                });

            } else if (driveType === 'onedrive') {
                await prisma.oneDriveToken.deleteMany({ where: { email } });
                await prisma.oneDriveToken.create({
                    data: { userId: user.id, accessToken, refreshToken, email },
                });

            } else if (driveType === 'dropbox') {
                await prisma.dropboxToken.deleteMany({ where: { email } });
                await prisma.dropboxToken.create({
                    data: { userId: user.id, accessToken, refreshToken, email },
                });
            }
        });

        return NextResponse.json({ message: 'Tokens saved successfully' });
    } catch (error: any) {
        console.error('Error during token exchange or saving:', error);
        return NextResponse.json({ error: 'Failed to save tokens' }, { status: 500 });
    }
}
