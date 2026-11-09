export function formatStudioDate(value: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  const date = new Date(`${value}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: "Africa/Abidjan" }).format(date);
}

export function formatStudioPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("225") ? digits.slice(3) : digits;
  if (local.length !== 10) return value;
  return `+225 ${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)} ${local.slice(8)}`;
}
