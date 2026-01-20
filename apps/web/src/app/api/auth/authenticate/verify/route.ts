import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, recordEvent } from '@bonfire/db';
import type { AuthenticationResponseJSON } from '@simplewebauthn/types';

import { createSession, jsonError } from '@/lib/auth';
import { logError, logInfo } from '@/lib/logging';
import { verifyAuthentication } from '@/lib/webauthn';

const verifySchema = z.object({
  email: z.string().email(),
  response: z.custom<AuthenticationResponseJSON>(),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid input', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (!user) {
      return jsonError('User not found', 404);
    }

    const verification = await verifyAuthentication(
      user.id,
      parsed.data.response.id,
      parsed.data.response,
    );

    if (!verification.verified || !verification.authenticationInfo) {
      return jsonError('Authentication failed', 401);
    }

    await prisma.webAuthnCredential.updateMany({
      where: {
        userId: user.id,
        credentialID: Buffer.from(parsed.data.response.id, 'base64url'),
      },
      data: {
        counter: verification.authenticationInfo.newCounter,
      },
    });

    await recordEvent({
      action: 'auth.passkey.signin',
      entityType: 'User',
      entityId: user.id,
      actorUserId: user.id,
    });

    await createSession(user.id);
    logInfo('auth.authenticate.verify', { requestId, userId: user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logError('auth.authenticate.verify.error', error, { requestId });
    return jsonError('Failed to verify authentication', 500);
  }
}
