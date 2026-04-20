import { NextResponse } from 'next/server';
import { prisma } from '@fuxie/database';

export async function PATCH(request: Request) {
  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found in system' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Role elevate error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
