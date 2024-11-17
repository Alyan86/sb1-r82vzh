import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // Find the token entry to delete
    const tokenEntry = await prisma.token.findFirst({
      where: { email },
    });

    if (!tokenEntry) {
      return NextResponse.json({ success: false, error: 'Token entry not found' }, { status: 404 });
    }

    // Delete the token entry
    await prisma.token.delete({
      where: { id: tokenEntry.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting token entry:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
