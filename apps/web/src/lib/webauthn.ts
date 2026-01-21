import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransport,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import { prisma } from '@bonfire/db';

const defaultRpID = process.env.WEBAUTHN_RP_ID ?? 'localhost';
const defaultOrigin = process.env.WEBAUTHN_ORIGIN ?? 'http://localhost:3000';
const rpName = 'Bonfire';

const challengeTTL = 5 * 60 * 1000;

export function resolveRpIdAndOrigin(originHeader?: string | null) {
  if (!originHeader) {
    return { rpID: defaultRpID, origin: defaultOrigin };
  }
  try {
    const url = new URL(originHeader);
    return { rpID: url.hostname, origin: url.origin };
  } catch {
    return { rpID: defaultRpID, origin: defaultOrigin };
  }
}

export async function createRegistrationOptions(
  userId: string,
  email: string,
  rpID: string,
) {
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(userId),
    userName: email,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  await prisma.webAuthnChallenge.create({
    data: {
      userId,
      type: 'registration',
      challenge: options.challenge,
      expiresAt: new Date(Date.now() + challengeTTL),
    },
  });

  return options;
}

export async function createAuthenticationOptions(userId: string, rpID: string) {
  const credentials = await prisma.webAuthnCredential.findMany({
    where: { userId },
  });

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.map((cred) => ({
      id: Buffer.from(cred.credentialID).toString('base64url'),
      type: 'public-key',
      transports: cred.transports ? (cred.transports.split(',') as AuthenticatorTransport[]) : undefined,
    })),
    userVerification: 'preferred',
  });

  await prisma.webAuthnChallenge.create({
    data: {
      userId,
      type: 'authentication',
      challenge: options.challenge,
      expiresAt: new Date(Date.now() + challengeTTL),
    },
  });

  return options;
}

async function consumeChallenge(userId: string, type: string) {
  const challenge = await prisma.webAuthnChallenge.findFirst({
    where: {
      userId,
      type,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (challenge) {
    await prisma.webAuthnChallenge.delete({ where: { id: challenge.id } });
  }

  return challenge?.challenge ?? null;
}

export async function verifyRegistration(
  userId: string,
  response: RegistrationResponseJSON,
  origin: string,
  rpID: string,
) {
  const expectedChallenge = await consumeChallenge(userId, 'registration');
  if (!expectedChallenge) {
    return { verified: false };
  }

  return verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });
}

export async function verifyAuthentication(
  userId: string,
  credentialId: string,
  response: AuthenticationResponseJSON,
  origin: string,
  rpID: string,
) {
  const expectedChallenge = await consumeChallenge(userId, 'authentication');
  if (!expectedChallenge) {
    return { verified: false };
  }

  const credential = await prisma.webAuthnCredential.findFirst({
    where: { userId, credentialID: Buffer.from(credentialId, 'base64url') },
  });

  if (!credential) {
    return { verified: false };
  }

  return verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: Buffer.from(credential.credentialID).toString('base64url'),
      publicKey: new Uint8Array(credential.publicKey),
      counter: credential.counter,
    },
  });
}
