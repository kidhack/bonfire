import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, recordEvent } from '@bonfire/db';

import { createSession, getSessionUser, jsonError } from '@/lib/auth';
import { verifyBackupCode } from '@/lib/backupCodes';
import { logError, logInfo } from '@/lib/logging';

const verifySchema = z.object({
  email: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().email().optional(),
  ),
  code: z.preprocess(
    (value) => {
      if (typeof value !== 'string') {
        return value;
      }
      const firstToken = value.trim().split(/\s+/)[0] ?? '';
      return firstToken;
    },
    z.string().min(6).max(64),
  ),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid input', 400);
    }

    const normalizedCode = parsed.data.code.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
    if (!normalizedCode) {
      return jsonError('Invalid input', 400);
    }

    const sessionUser = await getSessionUser();
    const email = parsed.data.email ?? sessionUser?.email;
    if (!email) {
      return jsonError('Email is required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return jsonError('User not found', 404);
    }

    const codes = await prisma.backupCode.findMany({
      where: { userId: user.id, usedAt: null },
    });

    const match = codes.find((code) => verifyBackupCode(normalizedCode, code.codeHash));
    if (!match) {
      return jsonError('Invalid backup code', 401);
    }

    await prisma.backupCode.update({
      where: { id: match.id },
      data: { usedAt: new Date() },
    });

    await recordEvent({
      action: 'auth.backup.redeem',
      entityType: 'User',
      entityId: user.id,
      actorUserId: user.id,
    });

    await createSession(user.id);
    logInfo('auth.backup.redeem', { requestId, userId: user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logError('auth.backup.redeem.error', error, { requestId });
    return jsonError('Failed to redeem backup code', 500);
  }
}
