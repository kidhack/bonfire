import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@bonfire/db';

const SESSION_COOKIE = 'bonfire_session';
const SESSION_DAYS = 30;

export async function createSession(userId: string) {
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      id,
      userId,
      expiresAt,
    },
  });

  const cookie = cookies();
  cookie.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return { id, expiresAt };
}

export async function clearSession() {
  const cookie = cookies();
  const sessionId = cookie.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }
  cookie.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
}

export async function getSessionUser() {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return null;
  }

  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  return session?.user ?? null;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
