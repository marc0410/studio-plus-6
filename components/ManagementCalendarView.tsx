import { prisma } from "@/lib/prisma";
import { StudioCalendar } from "@/components/StudioCalendar";
import { DEFAULT_CONFIG, validateConfig } from "@/lib/studio-domain";

export async function ManagementCalendarView() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Abidjan" }).format(new Date());
  const end = new Date(`${today}T12:00:00Z`); end.setUTCMonth(end.getUTCMonth() + 6);
  const endDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Abidjan" }).format(end);
  const [rows, configRow] = await Promise.all([prisma.booking.findMany({
    where: { date: { gte: today, lte: endDate }, status: { in: ["REQUESTED", "CONFIRMED", "IN_PROGRESS"] }, OR: [{ status: { not: "REQUESTED" } }, { expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    include: { service: { select: { name: true } }, assignments: { select: { staffId: true } } },
    orderBy: [{ date: "asc" }, { time: "asc" }], take: 1000,
  }), prisma.studioSettings.findUnique({ where: { key: "config" } })]);
  const config = configRow ? validateConfig(configRow.value) : DEFAULT_CONFIG;
  const assignedStaffIds = [...new Set(rows.flatMap(row => row.assignments.map(item => item.staffId)))];
  const [availabilityRules, availabilityExceptions] = assignedStaffIds.length ? await Promise.all([
    prisma.staffAvailabilityRule.findMany({ where: { staffId: { in: assignedStaffIds } } }),
    prisma.staffAvailabilityException.findMany({ where: { staffId: { in: assignedStaffIds }, date: { gte: today, lte: endDate } } }),
  ]) : [[], []];
  const conflicts = new Map<string, string[]>();
  const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  for (const booking of rows) {
    const flags: string[] = [];
    const start = toMinutes(booking.time);
    const endMinutes = start + booking.duration;
    const weekday = new Date(`${booking.date}T12:00:00Z`).getUTCDay();
    if (start < config.open * 60 || endMinutes > config.close * 60 || config.closedDays.includes(weekday) || config.closedDates.includes(booking.date)) flags.push("Hors des disponibilités du studio");
    if (rows.some(other => other.id !== booking.id && other.date === booking.date && start < toMinutes(other.time) + other.duration && toMinutes(other.time) < endMinutes)) flags.push("Chevauchement de séance");
    if (!booking.assignments.length) flags.push("Sans affectation");
    else {
      const hasUnavailableAssignedMember = booking.assignments.some(assignment => {
        const exception = availabilityExceptions.find(item => item.staffId === assignment.staffId && item.date === booking.date);
        if (exception) return !exception.isAvailable || toMinutes(exception.startTime ?? "00:00") > start || toMinutes(exception.endTime ?? "00:00") < endMinutes;
        return !availabilityRules.some(rule => rule.staffId === assignment.staffId && rule.weekday === weekday && toMinutes(rule.startTime) <= start && toMinutes(rule.endTime) >= endMinutes);
      });
      if (hasUnavailableAssignedMember) flags.push("Hors des disponibilités d’un membre affecté");
    }
    if (flags.length) conflicts.set(booking.id, flags);
  }
  return <section>
    <header className="portal-heading"><div><div className="eyebrow"><i />Pilotage Studio+</div><h1>Calendrier du studio.</h1></div><p>Demandes et séances actives, avec les alertes de disponibilité et d’affectation.</p></header>
    <StudioCalendar management initialDate={today} bookings={rows.map(row => ({ id: row.id, date: row.date, time: row.time, duration: row.duration, title: row.title, service: row.service.name, status: row.status, unassigned: row.assignments.length === 0, conflicts: conflicts.get(row.id), href: "/gestion/reservations" }))} />
  </section>;
}
