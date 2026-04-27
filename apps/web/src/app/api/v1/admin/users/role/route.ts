import { NextResponse } from 'next/server';
import { prisma, UserRole } from '@fuxie/database';
import { z } from 'zod';
import { getServerUser, invalidateServerUserCache } from '@/lib/auth/server-auth';

const roleMutationSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
});

export async function PATCH(request: Request) {
  try {
    const serverUser = await getServerUser();
    if (!serverUser || serverUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parsed = roleMutationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues.map((issue) => issue.message).join('; ') }, { status: 400 });
    }

    const { email, role } = parsed.data;
    if (email === serverUser.email && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admins cannot demote their own account.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firebaseUid: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found in system' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    invalidateServerUserCache(user.firebaseUid).catch(() => {});

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: unknown) {
    console.error("Role elevate error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
