import { NextResponse } from 'next/server';

import { clearSession } from '@/lib/auth';
import { logError, logInfo } from '@/lib/logging';

export async function POST() {
  const requestId = crypto.randomUUID();
  try {
    await clearSession();
    logInfo('auth.signout', { requestId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logError('auth.signout.error', error, { requestId });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
