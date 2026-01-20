import { NextResponse } from 'next/server';
import { prisma, recordEvent } from '@bonfire/db';

import { generateBackupCodes, hashBackupCode } from '@/lib/backupCodes';
import { getSessionUser, jsonError } from '@/lib/auth';
import { logError, logInfo } from '@/lib/logging';

export async function POST() {
  const requestId = crypto.randomUUID();
  try {
    const user = await getSessionUser();
    if (!user) {
      return jsonError('Not authenticated', 401);
    }

    const existing = await prisma.backupCode.findFirst({
      where: { userId: user.id },
    });

    if (existing) {
      return jsonError('Backup codes already generated', 409);
    }

    const codes = generateBackupCodes();
    await prisma.backupCode.createMany({
      data: codes.map((code) => ({
        userId: user.id,
        codeHash: hashBackupCode(code),
      })),
    });

    await recordEvent({
      action: 'auth.backup.generate',
      entityType: 'User',
      entityId: user.id,
      actorUserId: user.id,
    });

    logInfo('auth.backup.generate', { requestId, userId: user.id });
    return NextResponse.json({ codes });
  } catch (error) {
    logError('auth.backup.generate.error', error, { requestId });
    return jsonError('Failed to generate backup codes', 500);
  }
}
