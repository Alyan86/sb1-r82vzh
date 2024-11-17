// src/app/api/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';

const RATE_LIMIT_WINDOW = 30 * 60 * 1000; // 30 minutes
const RETRY_AFTER = 3 * 60 * 60 * 1000; // 3 hours

export async function POST(req: NextRequest) {
  const { method, identifier } = await req.json();

  // Convert the identifier to lowercase for case-insensitive matching
  const identifierLower = identifier.toLowerCase();

  const user = await prisma.user.findFirst({
    where: method === 'email' ? { email: identifierLower } : { username: identifierLower },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const recentCodes = await prisma.verificationCode.findMany({
    where: {
      userId: user.id,
      createdAt: {
        gt: new Date(Date.now() - RATE_LIMIT_WINDOW),
      },
    },
  });

  if (recentCodes.length >= 3) {
    const lastCodeTime = recentCodes[recentCodes.length - 1].createdAt;
    const timeSinceLastCode = Date.now() - lastCodeTime.getTime();

    if (timeSinceLastCode < RETRY_AFTER) {
      const retryAfter = Math.ceil((RETRY_AFTER - timeSinceLastCode) / (60 * 1000)); // in minutes
      return NextResponse.json({ error: `Try again in ${retryAfter} minutes` }, { status: 429 });
    }
  }

  // Overwrite previous codes
  await prisma.verificationCode.deleteMany({
    where: { userId: user.id },
  });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash the code
  const hashedCode = await bcrypt.hash(code, 10);

  await prisma.verificationCode.create({
    data: {
      userId: user.id,
      code: hashedCode, // Store the hashed code
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'contact.epicbytes.me@gmail.com',
      pass: 'gvrw voqy tyug gnaq', // Replace with your app password
    },
  });

  const mailOptions = {
    from: 'contact.epicbytes.me@gmail.com',
    to: user.email,
    subject: 'Password Reset Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f4f4f4;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://epicbytes.me/logos/Logo3.png" alt="EpicBytes Logo" style="width: 150px;"/>
        </div>
        <h2 style="text-align: center; color: #333;">Password Reset Request</h2>
        <p>Dear ${user.username},</p>
        <p>We received a request to reset your password. Please use the following code to reset your password:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="display: inline-block; padding: 10px 20px; border: 1px solid #ddd; border-radius: 5px; background-color: #fff; font-size: 18px; font-weight: bold;">${code}</span>
        </div>
        <p>This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
        <p>Thank you,<br/>The EpicBytes Team</p>
        <div style="text-align: center; margin-top: 20px;">
          <img src="https://epicbytes.me/logos/Logo3.png" alt="EpicBytes Logo" style="width: 100px;"/>
        </div>
      </div>
    `,
    text: `
      Dear ${user.username},

      We received a request to reset your password. Please use the following code to reset your password:

      ${code}

      This code will expire in 10 minutes. If you did not request this code, please ignore this email.

      Thank you,
      The EpicBytes Team
    `
  };

  await transporter.sendMail(mailOptions);

  return NextResponse.json({ message: 'Code sent' }, { status: 200 });
}
