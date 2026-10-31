/**
 * Atomic sequence generator for human-readable IDs (e.g. INV-0001, SUB-0001).
 * Uses the PostgreSQL Sequence table with upsert to prevent race conditions.
 */
export async function getNextSequenceNumber(prismaClient, name, prefix = 'INV-', padLength = 4) {
  const updated = await prismaClient.sequence.upsert({
    where: { name },
    update: { value: { increment: 1 } },
    create: { name, value: 1 },
  });
  return `${prefix}${String(updated.value).padStart(padLength, '0')}`;
}
