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

const oAuth2Client = new OAuth2Client(googleClientId, googleClientSecret, googleRedirectUri);

// Function to refresh Google access token (if needed)
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

// Function to refresh OneDrive access token (if needed)
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

// Helper to normalize file data
function normalizeFileData(files: any[], driveType: string) {
    return files.map(file => {
      // Determine the type of the item (folder or file) based on its properties
      let type = 'file'; // Default type is 'file'
  
      if (driveType === 'google') {
        // For Google Drive, check mimeType to determine folder or file
        if (file.mimeType?.includes('folder')) {
          type = 'folder';
        }
      } else if (driveType === 'onedrive') {
        // For OneDrive, check for the 'folder' property to detect folders
        if (file.folder) {
          type = 'folder';
        }
      }
  
      return {
        id: file.id,
        name: file.name,
        type,
        ...(driveType === 'onedrive' && file.folder && { folderId: file.id }) // Only add folderId for OneDrive items that are folders
      };
    });
  }
  

// API for extracting file information
export async function POST(req: NextRequest) {
  try {
    const { uuid, email, driveType, accessToken, parentId } = await req.json();
    
    // Check if accessToken is null or empty and set it to the string "null"
    const validAccessToken = accessToken ? accessToken : "null";
    
    console.log(`Extracting files for user: ${uuid}, driveType: ${driveType}, folderId: ${parentId || 'root'}`);

    let filesData;

    if (driveType === 'google') {
      try {
        oAuth2Client.setCredentials({ access_token: validAccessToken });
        const drive = google.drive({ version: 'v3', auth: oAuth2Client });

        const response = await drive.files.list({
          q: parentId ? `'${parentId}' in parents` : `'root' in parents`,
          fields: 'files(id, name, mimeType)',
        });

        filesData = normalizeFileData(response.data.files || [], 'google');
        return NextResponse.json(filesData);
      } catch (error: any) {
        if (error.response?.status === 401) {
          const user = await prisma.user.findUnique({ where: { uuid } });
          if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
          }

          const token = await prisma.token.findFirst({ where: { userId: user.id, email } });
          if (token?.refreshToken) {
            const newAccessToken = await refreshGoogleAccessToken(token.id, token.refreshToken);
            if (newAccessToken) {
              oAuth2Client.setCredentials({ access_token: newAccessToken });
              const drive = google.drive({ version: 'v3', auth: oAuth2Client });

              const response = await drive.files.list({
                q: parentId ? `'${parentId}' in parents` : `'root' in parents`,
                fields: 'files(id, name, mimeType)',
              });

              filesData = normalizeFileData(response.data.files || [], 'google');
              return NextResponse.json({ filesData, newAccessToken });
            }
          }
        }
      }
    } else if (driveType === 'onedrive') {
      try {
        const response = await fetch(
          `https://graph.microsoft.com/v1.0/me/drive/items/${parentId || 'root'}/children`, 
          { headers: { Authorization: `Bearer ${validAccessToken}` } }
        );

        if (response.ok) {
          const data = await response.json();
          filesData = normalizeFileData(data.value || [], 'onedrive');
          return NextResponse.json(filesData);
        } else if (response.status === 401) {
          const user = await prisma.user.findUnique({ where: { uuid } });
          if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
          }

          const token = await prisma.oneDriveToken.findFirst({ where: { userId: user.id, email } });
          if (token?.refreshToken) {
            const newAccessToken = await refreshOneDriveAccessToken(token.id, token.refreshToken);
            if (newAccessToken) {
              const retryResponse = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/items/${parentId || 'root'}/children`,
                { headers: { Authorization: `Bearer ${newAccessToken}` } }
              );

              if (retryResponse.ok) {
                const data = await retryResponse.json();
                filesData = normalizeFileData(data.value || [], 'onedrive');
                return NextResponse.json({ filesData, newAccessToken });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching OneDrive data:', error);
      }
    }

    return NextResponse.json({ error: 'Failed to retrieve files data' }, { status: 500 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again later.' }, { status: 500 });
  }
}
