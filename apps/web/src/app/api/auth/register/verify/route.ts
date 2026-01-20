import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, recordEvent } from '@bonfire/db';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';

import { createSession, getSessionUser, jsonError } from '@/lib/auth';
import { logError, logInfo } from '@/lib/logging';
import { verifyRegistration } from '@/lib/webauthn';

const verifySchema = z.object({
  email: z.string().email(),
  response: z.custom<RegistrationResponseJSON>(),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid input', 400);
    }

    const sessionUser = await getSessionUser();
    const user =
      sessionUser ??
      (await prisma.user.findUnique({
        where: { email: parsed.data.email },
      }));

    if (!user) {
      return jsonError('User not found', 404);
    }

    const verification = await verifyRegistration(user.id, parsed.data.response);
    if (!verification.verified || !verification.registrationInfo) {
      return jsonError('Registration verification failed', 400);
    }

    await prisma.webAuthnCredential.create({
      data: {
        userId: user.id,
        credentialID: Buffer.from(verification.registrationInfo.credentialID),
        publicKey: Buffer.from(verification.registrationInfo.credentialPublicKey),
        counter: verification.registrationInfo.counter,
        transports: verification.registrationInfo.transports?.join(',') ?? null,
      },
    });

    await recordEvent({
      action: 'auth.passkey.register',
      entityType: 'User',
      entityId: user.id,
      actorUserId: user.id,
    });

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
    });

    if (!membership) {
      const organization = await prisma.organization.create({
        data: {
          name: `${user.displayName}'s Workspace`,
          memberships: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
          entitlements: {
            create: {
              plan: 'free',
              subscriptionStatus: 'active',
              features: {},
              limits: {},
            },
          },
        },
      });

      await recordEvent({
        action: 'org.create',
        entityType: 'Organization',
        entityId: organization.id,
        actorUserId: user.id,
        organizationId: organization.id,
      });
    }

    await createSession(user.id);
    logInfo('auth.register.verify', { requestId, userId: user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logError('auth.register.verify.error', error, { requestId });
    return jsonError('Failed to verify registration', 500);
  }
}
