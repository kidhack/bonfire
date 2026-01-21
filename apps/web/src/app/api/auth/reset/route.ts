import { NextResponse } from 'next/server';
import { prisma, recordEvent } from '@bonfire/db';

import { clearSession, getSessionUser, jsonError } from '@/lib/auth';
import { logError, logInfo } from '@/lib/logging';

export async function POST() {
  const requestId = crypto.randomUUID();
  try {
    const user = await getSessionUser();
    if (!user) {
      return jsonError('Not authenticated', 401);
    }

    await prisma.$transaction([
      prisma.webAuthnCredential.deleteMany({ where: { userId: user.id } }),
      prisma.backupCode.deleteMany({ where: { userId: user.id } }),
      prisma.webAuthnChallenge.deleteMany({ where: { userId: user.id } }),
      prisma.session.deleteMany({ where: { userId: user.id } }),
      prisma.membership.deleteMany({ where: { userId: user.id } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    await recordEvent({
      action: 'auth.user.reset',
      entityType: 'User',
      entityId: user.id,
      actorUserId: user.id,
    });

    await clearSession();
    logInfo('auth.reset', { requestId, userId: user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logError('auth.reset.error', error, { requestId });
    return jsonError('Failed to reset user', 500);
  }
}
