import { NextResponse } from 'next/server';
import { prisma } from '@bonfire/db';
import { passkeyAuthenticateSchema } from '@bonfire/types';

import { jsonError } from '@/lib/auth';
import { logError, logInfo } from '@/lib/logging';
import { createAuthenticationOptions } from '@/lib/webauthn';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json();
    const parsed = passkeyAuthenticateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid input', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      include: { credentials: true },
    });

    if (!user || user.credentials.length === 0) {
      return jsonError('No passkeys found for this account', 404);
    }

    const options = await createAuthenticationOptions(user.id);
    logInfo('auth.authenticate.options', { requestId, userId: user.id });
    return NextResponse.json(options);
  } catch (error) {
    logError('auth.authenticate.options.error', error, { requestId });
    return jsonError('Failed to create authentication options', 500);
  }
}
