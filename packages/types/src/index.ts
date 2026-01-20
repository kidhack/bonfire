import { z } from 'zod';

export const emailSchema = z.string().email();
export const displayNameSchema = z.string().min(2).max(80);
export const backupCodeSchema = z.string().min(6).max(32);

export const passkeyRegisterSchema = z.object({
  email: emailSchema,
  displayName: displayNameSchema,
});

export const passkeyAuthenticateSchema = z.object({
  email: emailSchema,
});
