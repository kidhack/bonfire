import { NextResponse } from 'next/server';
import { prisma, recordEvent } from '@bonfire/db';
import { passkeyRegisterSchema } from '@bonfire/types';

import { getSessionUser, jsonError } from '@/lib/auth';
import { logError, logInfo } from '@/lib/logging';
import { createRegistrationOptions } from '@/lib/webauthn';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    const parsed = passkeyRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid input', 400);
    }

    const sessionUser = await getSessionUser();
    let user = sessionUser;

    if (!user) {
      const existing = await prisma.user.findUnique({
        where: { email: parsed.data.email },
      });

      if (existing) {
        return jsonError('Account exists. Sign in to add a passkey.', 409);
      }

      user = await prisma.user.create({
        data: {
          email: parsed.data.email,
          displayName: parsed.data.displayName,
        },
      });

      await recordEvent({
        action: 'auth.user.create',
        entityType: 'User',
        entityId: user.id,
        actorUserId: user.id,
      });
    }

    const options = await createRegistrationOptions(user.id, user.email);
    logInfo('auth.register.options', { requestId, userId: user.id });
    return NextResponse.json(options);
  } catch (error) {
    logError('auth.register.options.error', error, { requestId });
    return jsonError('Failed to create registration options', 500);
  }
}
