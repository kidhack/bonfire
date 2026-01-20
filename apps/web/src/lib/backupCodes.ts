import crypto from 'crypto';

export function generateBackupCodes(count = 10) {
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const raw = crypto.randomBytes(4).toString('hex');
    codes.push(raw);
  }
  return codes;
}

export function hashBackupCode(code: string, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(code, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyBackupCode(code: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) {
    return false;
  }
  const inputHash = crypto.scryptSync(code, salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(inputHash, 'hex'));
}
