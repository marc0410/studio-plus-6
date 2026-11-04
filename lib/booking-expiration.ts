import { prisma } from "@/lib/prisma";

export async function expirePendingBookings(now = new Date()) {
  const expired = await prisma.booking.findMany({ where: { status: "REQUESTED", expiresAt: { lte: now } }, select: { id: true }, take: 500 });
  if (!expired.length) return [];
  return prisma.$transaction(async tx => {
    const ids: string[] = [];
    for (const item of expired) {
      const changed = await tx.booking.updateMany({ where: { id: item.id, status: "REQUESTED", expiresAt: { lte: now } }, data: { status: "CANCELLED" } });
      if (!changed.count) continue;
      await tx.bookingSlot.deleteMany({ where: { bookingId: item.id } });
      ids.push(item.id);
    }
    return ids;
  });
}
