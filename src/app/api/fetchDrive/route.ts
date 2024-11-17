import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { getClientIp } from '../../utils/ipUtils';

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;
const oAuth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

const driveEndpoint = 'https://graph.microsoft.com/v1.0/me/drive/root/children';
const storageEndpoint = 'https://graph.microsoft.com/v1.0/me/drive';

async function refreshAccessToken(tokenId: number, refreshToken: string): Promise<string | null> {
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
    console.error('Failed to refresh access token:', error);
    return null;
  }
  return null;
}

async function refreshOneDriveAccessToken(tokenId: number, refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.NEXT_PUBLIC_ONEDRIVE_CLIENT_ID!,
        client_secret: process.env.ONEDRIVE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        redirect_uri: process.env.NEXT_PUBLIC_ONEDRIVE_REDIRECT_URI!,
      }),
    });

    const data = await response.json();

    if (response.ok && data.access_token) {
      await prisma.oneDriveToken.update({
        where: { id: tokenId },
        data: { accessToken: data.access_token, updatedAt: new Date() },
      });
      return data.access_token;
    } else {
      console.error('Failed to refresh OneDrive access token:', data);
    }
  } catch (error) {
    console.error('Error refreshing OneDrive access token:', error);
  }
  return null;
}

async function getRefreshToken(email: string): Promise<string | null> {
  const tokens = await prisma.token.findMany({ where: { email } });
  for (const token of tokens) {
    if (token.refreshToken) {
      return token.refreshToken;
    }
  }
  return null;
}

async function getOneDriveTokens(userId: number) {
  return await prisma.oneDriveToken.findMany({
    where: { userId },
  });
}

// Recursive helper function to fetch subfolders and subfiles
async function fetchOneDriveFolderItems(accessToken: string, folderId: string = 'root'): Promise<any[]> {
  const endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`;
  const folderItems: any[] = [];

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.ok) {
    const data = await response.json();

    for (const item of data.value) {
      if (item.folder) {
        // Recursively fetch subfolder items
        const subfolderItems = await fetchOneDriveFolderItems(accessToken, item.id);
        folderItems.push({
          id: item.id,
          name: item.name,
          mimeType: 'folder',
          size: item.size,
          lastModifiedDateTime: item.lastModifiedDateTime,
          children: subfolderItems, // Include children items recursively
        });
      } else {
        folderItems.push({
          id: item.id,
          name: item.name,
          mimeType: item.file?.mimeType,
          size: item.size,
          lastModifiedDateTime: item.lastModifiedDateTime,
        });
      }
    }
  } else {
    console.error(`Error fetching OneDrive folder items: ${response.statusText}`);
  }

  return folderItems;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user based on IP and session key
    const clientIp = getClientIp(req);
    const cookies = req.cookies;
    const sessionKey = cookies.get('sessionKey')?.value;

    if (!sessionKey || !clientIp) {
      return NextResponse.json({ isAuthenticated: false, error: 'Unauthorized' });
    }

    const user = await prisma.user.findFirst({ where: { sessionKey } });

    if (!user || user.ipAddress !== clientIp) {
      // Log out user if IP mismatches
      await prisma.user.update({ where: { id: user?.id }, data: { sessionKey: null, ipAddress: null } });
      return NextResponse.json({ isAuthenticated: false, error: 'Unauthorized access detected' });
    }

    // 2. Fetch drive data if authenticated
    const userId = user.id;
    const tokens = await prisma.token.findMany({ where: { userId } });

    const driveDataList: Array<{ email: string; driveType: string; files: Array<any> }> = [];
    const storageQuotaList: Array<any> = [];

    for (const token of tokens) {
      let accessToken = token.accessToken;
      let refreshToken: string | null = token.refreshToken;

      if (!refreshToken) {
        refreshToken = await getRefreshToken(token.email);
      }

      if (!refreshToken) {
        console.error(`No refresh token found for email: ${token.email}`);
        continue;
      }

      oAuth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      try {
        const drive = google.drive({ version: 'v3', auth: oAuth2Client });

        const { data: driveData } = await drive.files.list({
          q: "trashed = false and 'me' in owners",
          fields: 'files(id, name, mimeType, parents, size)',
        });

        const about = await drive.about.get({ fields: 'storageQuota' });

        if (driveData.files) {
          driveDataList.push({
            email: token.email,
            driveType: 'google',
            files: driveData.files.map((file: any) => ({
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              parents: file.parents,
              size: file.size,
            })),
          });
        }

        storageQuotaList.push({
          email: token.email,
          storageQuota: about.data.storageQuota,
        });
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.error('Google Access token is expired or invalid. Attempting to refresh.');

          const newAccessToken = await refreshAccessToken(token.id, refreshToken);

          if (newAccessToken) {
            oAuth2Client.setCredentials({ access_token: newAccessToken });

            try {
              const drive = google.drive({ version: 'v3', auth: oAuth2Client });

              const { data: driveData } = await drive.files.list({
                q: "trashed = false and 'me' in owners",
                fields: 'files(id, name, mimeType, parents, size)',
              });

              const about = await drive.about.get({ fields: 'storageQuota' });

              if (driveData.files) {
                driveDataList.push({
                  email: token.email,
                  driveType: 'google',
                  files: driveData.files.map((file: any) => ({
                    id: file.id,
                    name: file.name,
                    mimeType: file.mimeType,
                    parents: file.parents,
                    size: file.size,
                  })),
                });
              }

              storageQuotaList.push({
                email: token.email,
                storageQuota: about.data.storageQuota,
              });
            } catch (error) {
              console.error('Error fetching Google drive data after token refresh:', error);
              continue;
            }
          } else {
            console.error('Failed to refresh Google access token. Skipping to next token.');
            continue;
          }
        } else {
          console.error('Error fetching Google drive data:', error);
          continue;
        }
      }
    }

    // Fetch OneDrive tokens
    const oneDriveTokens = await getOneDriveTokens(userId);
    const oneDriveDataList: Array<{ email: string; driveType: string; files: Array<any> }> = [];
    const oneDriveStorageQuotaList: Array<any> = [];

    for (const token of oneDriveTokens) {
      let accessToken = token.accessToken;

      try {
        const folderItems = await fetchOneDriveFolderItems(accessToken);

        if (folderItems.length) {
          oneDriveDataList.push({
            email: token.email,
            driveType: 'onedrive',
            files: folderItems,
          });
        }

        // Fetch storage quota
        const response = await fetch(storageEndpoint, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const data = await response.json();

        if (response.ok) {
          oneDriveStorageQuotaList.push({
            email: token.email,
            storageQuota: data.quota,
          });
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.error('OneDrive Access token is expired or invalid. Attempting to refresh.');

          const newAccessToken = await refreshOneDriveAccessToken(token.id, token.refreshToken);

          if (newAccessToken) {
            try {
              const folderItems = await fetchOneDriveFolderItems(newAccessToken);

              if (folderItems.length) {
                oneDriveDataList.push({
                  email: token.email,
                  driveType: 'onedrive',
                  files: folderItems,
                });
              }

              const response = await fetch(storageEndpoint, {
                headers: { Authorization: `Bearer ${newAccessToken}` },
              });

              const data = await response.json();

              if (response.ok) {
                oneDriveStorageQuotaList.push({
                  email: token.email,
                  storageQuota: data.quota,
                });
              }
            } catch (error) {
              console.error('Error fetching OneDrive data after token refresh:', error);
              continue;
            }
          } else {
            console.error('Failed to refresh OneDrive access token. Skipping to next token.');
            continue;
          }
        } else {
          console.error('Error fetching OneDrive data:', error);
          continue;
        }
      }
    }

    return NextResponse.json({
      isAuthenticated: true,
      drives: [...driveDataList, ...oneDriveDataList],
      storageQuota: [...storageQuotaList, ...oneDriveStorageQuotaList],
    });
  } catch (error) {
    console.error('Error in fetchDrive handler:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again later.' });
  }
}
