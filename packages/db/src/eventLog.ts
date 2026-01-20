import type { Prisma } from '@prisma/client';

import { prisma } from './client';

export type EventLogInput = Omit<Prisma.EventLogCreateInput, 'organization' | 'actor'> & {
  organizationId?: string | null;
  actorUserId?: string | null;
};

export async function recordEvent(input: EventLogInput) {
  const { organizationId, actorUserId, ...rest } = input;
  return prisma.eventLog.create({
    data: {
      ...rest,
      organization: organizationId ? { connect: { id: organizationId } } : undefined,
      actor: actorUserId ? { connect: { id: actorUserId } } : undefined,
    },
  });
}
