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

// For Google OAuth2
const oAuth2Client = new OAuth2Client(googleClientId, googleClientSecret, googleRedirectUri);

// Helper function to refresh Google access token
async function refreshGoogleAccessToken(tokenId: number, refreshToken: string): Promise<string | null> {
  try {
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oAuth2Client.refreshAccessToken();
    const newAccessToken = credentials.access_token;

    if (newAccessToken) {
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
        client_id: process.env.DROPBOX_APP_KEY!, // Using the correct Dropbox App Key
        client_secret: process.env.DROPBOX_APP_SECRET!, // Using the correct Dropbox App Secret
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh Dropbox access token:', await response.json());
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access_token;

    if (newAccessToken) {
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

// Mobile API: Fetch user by UUID and retrieve drive data
export async function POST(req: NextRequest) {
  try {
    const { uuid } = await req.json();

    // Find the user by UUID
    const user = await prisma.user.findUnique({
      where: { uuid },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;
    const driveDataList: Array<{
      email: string;
      driveType: string;
      storageQuota: any;
      accessToken?: string;
    }> = [];

    // Fetch Google Drive data
    const googleTokens = await prisma.token.findMany({ where: { userId } });
    for (const token of googleTokens) {
      let accessToken = token.accessToken;
      const refreshToken = token.refreshToken;

      if (refreshToken) {
        oAuth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
        try {
          const drive = google.drive({ version: 'v3', auth: oAuth2Client });
          const about = await drive.about.get({ fields: 'storageQuota' });
          const storageQuota = about.data.storageQuota;

          if (storageQuota) {
            driveDataList.push({
              email: token.email,
              driveType: 'google',
              storageQuota: {
                limit: storageQuota.limit || '0',
                usage: storageQuota.usage || '0',
              },
              accessToken,
            });
          }
        } catch (error: any) {
          if (error.response?.status === 401) {
            const newAccessToken = await refreshGoogleAccessToken(token.id, refreshToken);
            if (newAccessToken) {
              oAuth2Client.setCredentials({ access_token: newAccessToken });
              const drive = google.drive({ version: 'v3', auth: oAuth2Client });
              const about = await drive.about.get({ fields: 'storageQuota' });

              const storageQuota = about.data.storageQuota;
              if (storageQuota) {
                driveDataList.push({
                  email: token.email,
                  driveType: 'google',
                  storageQuota: {
                    limit: storageQuota.limit || '0',
                    usage: storageQuota.usage || '0',
                  },
                  accessToken: newAccessToken,
                });
              }
            }
          } else {
            console.error('Error fetching Google Drive data:', error);
          }
        }
      }
    }

    // Fetch OneDrive data
    const oneDriveTokens = await prisma.oneDriveToken.findMany({ where: { userId } });
    for (const token of oneDriveTokens) {
      let accessToken = token.accessToken;
      const refreshToken = token.refreshToken;

      try {
        const response = await fetch(storageEndpoint, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok && response.status === 401 && refreshToken) {
          const newAccessToken = await refreshOneDriveAccessToken(token.id, refreshToken);
          if (newAccessToken) {
            accessToken = newAccessToken;
            const retryResponse = await fetch(storageEndpoint, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (retryResponse.ok) {
              const data = await retryResponse.json();
              driveDataList.push({
                email: token.email,
                driveType: 'onedrive',
                storageQuota: {
                  limit: data.quota.total || 0,
                  usage: data.quota.used || 0,
                },
                accessToken,
              });
            }
          }
        } else if (response.ok) {
          const data = await response.json();
          driveDataList.push({
            email: token.email,
            driveType: 'onedrive',
            storageQuota: {
              limit: data.quota.total || 0,
              usage: data.quota.used || 0,
            },
            accessToken,
          });
        }
      } catch (error) {
        console.error('Error fetching OneDrive data:', error);
      }
    }

    // Fetch Dropbox data
    const dropboxTokens = await prisma.dropboxToken.findMany({ where: { userId } });
    for (const token of dropboxTokens) {
      let accessToken = token.accessToken;
      const refreshToken = token.refreshToken;

      try {
        const response = await fetch(dropboxQuotaEndpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok && response.status === 401 && refreshToken) {
          const newAccessToken = await refreshDropboxAccessToken(token.id, refreshToken);
          if (newAccessToken) {
            accessToken = newAccessToken;
            const retryResponse = await fetch(dropboxQuotaEndpoint, {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (retryResponse.ok) {
              const data = await retryResponse.json();
              driveDataList.push({
                email: token.email,
                driveType: 'dropbox',
                storageQuota: {
                  limit: data.allocation.allocated || 0,
                  usage: data.used || 0,
                },
                accessToken,
              });
            }
          }
        } else if (response.ok) {
          const data = await response.json();
          driveDataList.push({
            email: token.email,
            driveType: 'dropbox',
            storageQuota: {
              limit: data.allocation.allocated || 0,
              usage: data.used || 0,
            },
            accessToken,
          });
        }
      } catch (error) {
        console.error('Error fetching Dropbox data:', error);
      }
    }

    return NextResponse.json({ drives: driveDataList });
  } catch (error) {
    console.error('Error in POST /apiMobile/optDriveData:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
