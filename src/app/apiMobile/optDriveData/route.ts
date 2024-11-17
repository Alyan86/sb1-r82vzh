import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { Dropbox } from 'dropbox';  // Dropbox SDK



const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET!;
const googleRedirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!;
const microsoftClientId = process.env.NEXT_PUBLIC_ONEDRIVE_CLIENT_ID!;
const microsoftClientSecret = process.env.ONEDRIVE_CLIENT_SECRET!;
const dropboxClientId = process.env.DROPBOX_APP_KEY!;
const dropboxClientSecret = process.env.DROPBOX_APP_SECRET!;
const microsoftTokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

const oAuth2Client = new OAuth2Client(googleClientId, googleClientSecret, googleRedirectUri);

// Constants for drive types and default values
const GOOGLE = 'google';
const ONEDRIVE = 'onedrive';
const DROPBOX = 'dropbox';
const ROOT = 'root';

// Simple in-memory cache with expiry time (for demonstration purposes)
const cache = new Map();

// Cache expiration time in milliseconds (e.g., 50 minutes)
const CACHE_EXPIRATION_TIME = 50 * 60 * 1000;

// Helper function to normalize file data for Google, OneDrive, and Dropbox
function normalizeFileData(files: any[], driveType: string) {
  return files.map(file => {
    const isFolder = (driveType === GOOGLE && file.mimeType?.includes('folder')) || 
                     (driveType === ONEDRIVE && file.folder) || 
                     (driveType === DROPBOX && file['.tag'] === 'folder');
    return {
      id: file.id,
      name: file.name,
      type: isFolder ? 'folder' : 'file',
      size: file.size || null, // Add size to the normalized data (will be null if not available)
      ...(driveType === ONEDRIVE && file.folder && { folderId: file.id })
    };
  });
}

// Generalized function to refresh access tokens for Google, OneDrive, and Dropbox
async function refreshAccessToken(driveType: string, tokenId: number, refreshToken: string) {
  try {
    if (driveType === GOOGLE) {
      return await refreshGoogleAccessToken(tokenId, refreshToken);
    } else if (driveType === ONEDRIVE) {
      return await refreshOneDriveAccessToken(tokenId, refreshToken);
    } else if (driveType === DROPBOX) {
      return await refreshDropboxAccessToken(tokenId, refreshToken);
    }
    return null;
  } catch (error) {
    console.error(`Error refreshing ${driveType} access token:`, error);
    return null;
  }
}

// Function to refresh Google access token
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

// Function to refresh OneDrive access token
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

    if (response.ok) {
      const data = await response.json();
      const newAccessToken = data.access_token;

      if (newAccessToken) {
        await prisma.oneDriveToken.update({
          where: { id: tokenId },
          data: { accessToken: newAccessToken, updatedAt: new Date() },
        });
        return newAccessToken;
      }
    } else {
      console.error('Failed to refresh OneDrive access token:', await response.json());
    }
  } catch (error) {
    console.error('Error refreshing OneDrive access token:', error);
  }
  return null;
}

// Function to refresh Dropbox access token
async function refreshDropboxAccessToken(tokenId: number, refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: dropboxClientId,
        client_secret: dropboxClientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const newAccessToken = data.access_token;

      if (newAccessToken) {
        await prisma.dropboxToken.update({
          where: { id: tokenId },
          data: { accessToken: newAccessToken, updatedAt: new Date() },
        });
        return newAccessToken;
      }
    } else {
      console.error('Failed to refresh Dropbox access token:', await response.json());
    }
  } catch (error) {
    console.error('Error refreshing Dropbox access token:', error);
  }
  return null;
}

// Function to fetch files from Google Drive
async function fetchGoogleDriveFiles(accessToken: string, parentId: string | null) {
  try {
    oAuth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    const response = await drive.files.list({
      q: parentId ? `'${parentId}' in parents` : `'root' in parents`,
      fields: 'files(id, name, mimeType, size)', // Request size along with other metadata
    });
    return normalizeFileData(response.data.files || [], GOOGLE);
  } catch (error) {
    console.error('Google Drive fetch failed:', error);
    throw new Error('Google Drive fetch failed');
  }
}

// Function to fetch files from OneDrive
async function fetchOneDriveFiles(accessToken: string, parentId: string | null) {
  try {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${parentId || ROOT}/children`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      return normalizeFileData(data.value || [], ONEDRIVE);
    } else {
      console.error('OneDrive fetch failed:', await response.json());
      throw new Error('OneDrive fetch failed');
    }
  } catch (error) {
    console.error('Error fetching OneDrive data:', error);
    throw new Error('OneDrive fetch failed');
  }
}

// Function to fetch files from Dropbox
async function fetchDropboxFiles(accessToken: string, parentId: string | null) {
  try {
    const dbx = new Dropbox({ accessToken, fetch: globalThis.fetch });
    const response = await dbx.filesListFolder({ path: parentId || '' });
    return normalizeFileData(response.result.entries || [], DROPBOX);
  } catch (error) {
    console.error('Dropbox fetch failed:', error);
    throw new Error('Dropbox fetch failed');
  }
}

// Main API handler to fetch files
export async function POST(req: NextRequest) {
  try {
    const { uuid, email, driveType, accessToken, parentId } = await req.json();
    const validAccessToken = accessToken || "null";
    console.log(`Extracting files for user: ${uuid}, driveType: ${driveType}, folderId: ${parentId || ROOT}`);

    // Check if the cache exists for the user with the same UUID, email, and driveType
    const cacheKey = `${uuid}:${email}:${driveType}`;
    const cachedData = cache.get(cacheKey);
    const currentTime = Date.now();

    if (cachedData) {
      // Check if the cached data has expired
      if (currentTime - cachedData.timestamp < CACHE_EXPIRATION_TIME) {
        console.log('Cache hit, using cached access token');
        const filesData = await (driveType === GOOGLE
          ? fetchGoogleDriveFiles(cachedData.accessToken, parentId)
          : driveType === ONEDRIVE
          ? fetchOneDriveFiles(cachedData.accessToken, parentId)
          : fetchDropboxFiles(cachedData.accessToken, parentId));
        return NextResponse.json(filesData);
      } else {
        console.log('Cache expired, refreshing access token');
      }
    }

    try {
      // Try fetching files based on drive type
      let filesData = await (driveType === GOOGLE
        ? fetchGoogleDriveFiles(validAccessToken, parentId)
        : driveType === ONEDRIVE
        ? fetchOneDriveFiles(validAccessToken, parentId)
        : fetchDropboxFiles(validAccessToken, parentId));

      // Cache the access token and relevant data
      cache.set(cacheKey, {
        accessToken: validAccessToken,
        timestamp: currentTime,
      });

      return NextResponse.json(filesData);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
        if (error.message.includes('fetch failed')) {
          const user = await prisma.user.findUnique({ where: { uuid } });
          if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
          }

          const token = driveType === GOOGLE
            ? await prisma.token.findFirst({ where: { userId: user.id, email } })
            : driveType === ONEDRIVE
            ? await prisma.oneDriveToken.findFirst({ where: { userId: user.id, email } })
            : await prisma.dropboxToken.findFirst({ where: { userId: user.id, email } });

          if (token?.refreshToken) {
            const newAccessToken = await refreshAccessToken(driveType, token.id, token.refreshToken);
            if (newAccessToken) {
              const retryData = await (driveType === GOOGLE
                ? fetchGoogleDriveFiles(newAccessToken, parentId)
                : driveType === ONEDRIVE
                ? fetchOneDriveFiles(newAccessToken, parentId)
                : fetchDropboxFiles(newAccessToken, parentId));

              // Cache the new access token
              cache.set(cacheKey, {
                accessToken: newAccessToken,
                timestamp: currentTime,
              });

              return NextResponse.json(retryData);
            }
          }
        }
        return NextResponse.json({ error: 'Failed to retrieve files data' }, { status: 500 });
      } else {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error handling the request:', error);
    return NextResponse.json({ error: 'Request handling failed' }, { status: 500 });
  }
}
