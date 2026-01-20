import { prisma } from './client';

async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'demo@bonfire.app',
      displayName: 'Demo User',
    },
  });

  const organization = await prisma.organization.create({
    data: {
      name: 'Demo Studio',
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

  await prisma.eventLog.create({
    data: {
      organizationId: organization.id,
      actorUserId: user.id,
      action: 'seed.create',
      entityType: 'Organization',
      entityId: organization.id,
      metadata: { source: 'seed' },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
