import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET!;
const googleRedirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;
const microsoftClientId = process.env.NEXT_PUBLIC_ONEDRIVE_CLIENT_ID!;
const microsoftClientSecret = process.env.ONEDRIVE_CLIENT_SECRET!;
const microsoftTokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const storageEndpoint = 'https://graph.microsoft.com/v1.0/me/drive';
const dropboxTokenEndpoint = 'https://api.dropboxapi.com/oauth2/token';
const dropboxQuotaEndpoint = 'https://api.dropboxapi.com/2/users/get_space_usage';

const oAuth2Client = new OAuth2Client(googleClientId, googleClientSecret, googleRedirectUri);

// Helper function to refresh Google access token
async function refreshGoogleAccessToken(tokenId: number, refreshToken: string): Promise<string | null> {
  try {
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oAuth2Client.refreshAccessToken();
    const newAccessToken = credentials.access_token;

    if (newAccessToken) {
      console.log(`Updating Google access token in the database for token ID: ${tokenId}`);
      await prisma.token.update({
        where: { id: tokenId },
        data: { accessToken: newAccessToken, updatedAt: new Date() },
      });
      return newAccessToken;
    }
  } catch (error) {
    console.error('Failed to refresh Google access token:', error);
  }
  return null;
}

// Helper function to refresh OneDrive access token
async function refreshOneDriveAccessToken(tokenId: number, refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(microsoftTokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: microsoftClientId,
        client_secret: microsoftClientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/.default',
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh OneDrive access token:', await response.json());
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access_token;

    if (newAccessToken) {
      console.log(`Updating OneDrive access token in the database for token ID: ${tokenId}`);
      await prisma.oneDriveToken.update({
        where: { id: tokenId },
        data: { accessToken: newAccessToken, updatedAt: new Date() },
      });
      return newAccessToken;
    }
  } catch (error) {
    console.error('Error refreshing OneDrive access token:', error);
  }
  return null;
}

// Helper function to refresh Dropbox access token
async function refreshDropboxAccessToken(tokenId: number, refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch(dropboxTokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.DROPBOX_APP_KEY!,
        client_secret: process.env.DROPBOX_APP_SECRET!,
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh Dropbox access token:', await response.json());
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access_token;

    if (newAccessToken) {
      console.log(`Updating Dropbox access token in the database for token ID: ${tokenId}`);
      await prisma.dropboxToken.update({
        where: { id: tokenId },
        data: { accessToken: newAccessToken, updatedAt: new Date() },
      });
      return newAccessToken;
    }
  } catch (error) {
    console.error('Error refreshing Dropbox access token:', error);
  }
  return null;
}

// Main API: Refresh a specific drive's data
export async function POST(req: NextRequest) {
  try {
    const { uuid, email, driveType } = await req.json();

    // Retrieve the token from the database
    const user = await prisma.user.findUnique({ where: { uuid } });
    if (!user) {
      console.log(`User not found for UUID: ${uuid}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let token, refreshToken, accessToken;
    if (driveType === 'google') {
      token = await prisma.token.findFirst({ where: { userId: user.id, email } });
    } else if (driveType === 'onedrive') {
      token = await prisma.oneDriveToken.findFirst({ where: { userId: user.id, email } });
    } else if (driveType === 'dropbox') {
      token = await prisma.dropboxToken.findFirst({ where: { userId: user.id, email } });
    }

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    accessToken = token.accessToken;
    refreshToken = token.refreshToken;

    // Verify the current access token from the database
    const isTokenValid = await verifyAccessToken(driveType, accessToken);
    if (!isTokenValid && refreshToken) {
      console.log('Access token invalid, attempting to refresh...');
      if (driveType === 'google') {
        accessToken = await refreshGoogleAccessToken(token.id, refreshToken);
      } else if (driveType === 'onedrive') {
        accessToken = await refreshOneDriveAccessToken(token.id, refreshToken);
      } else if (driveType === 'dropbox') {
        accessToken = await refreshDropboxAccessToken(token.id, refreshToken);
      }

      if (!accessToken) {
        return NextResponse.json({ error: 'Failed to refresh access token' }, { status: 500 });
      }
    }

    // Fetch the drive data using the valid access token
    let driveData;
    if (driveType === 'google') {
      oAuth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: 'v3', auth: oAuth2Client });
      const about = await drive.about.get({ fields: 'storageQuota' });
      const storageQuota = about.data.storageQuota;
      driveData = {
        email,
        driveType: 'google',
        storageQuota: {
          limit: storageQuota?.limit || '0',
          usage: storageQuota?.usage || '0',
        },
      };
    } else if (driveType === 'onedrive') {
      const response = await fetch(storageEndpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      driveData = {
        email,
        driveType: 'onedrive',
        storageQuota: {
          limit: data.quota.total || 0,
          usage: data.quota.used || 0,
        },
      };
    } else if (driveType === 'dropbox') {
      const response = await fetch(dropboxQuotaEndpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      driveData = {
        email,
        driveType: 'dropbox',
        storageQuota: {
          limit: data.allocation.allocated || 0,
          usage: data.used || 0,
        },
      };
    }

    return NextResponse.json(driveData);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again later.' }, { status: 500 });
  }
}

// Helper function to verify the current access token
async function verifyAccessToken(driveType: string, accessToken: string): Promise<boolean> {
  try {
    if (driveType === 'google') {
      oAuth2Client.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: 'v3', auth: oAuth2Client });
      await drive.about.get({ fields: 'storageQuota' });
      return true;
    } else if (driveType === 'onedrive') {
      const response = await fetch(storageEndpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.ok;
    } else if (driveType === 'dropbox') {
      const response = await fetch(dropboxQuotaEndpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.ok;
    }
  } catch {
    return false; // Return false if an error occurs
  }

  return false; // Fallback return statement for unsupported drive types
}
