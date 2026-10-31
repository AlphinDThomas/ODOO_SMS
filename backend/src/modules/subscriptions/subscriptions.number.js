import { prisma } from '../../config/prisma.js';

export async function getNextSubscriptionNumber(tx) {
  const client = tx || prisma;
  const seq = await client.sequence.upsert({
    where: { name: 'subscription' },
    create: { name: 'subscription', value: 1 },
    update: { value: { increment: 1 } },
  });
  return `SUB-${String(seq.value).padStart(4, '0')}`;
}
