export type StudioService = {
  id: string;
  name: string;
  tag: string;
  duration: number;
  price: number | null;
  description: string;
  image: string;
  color: string;
};
export type StudioConfig = {
  services: StudioService[];
  open: number;
  close: number;
  closedDays: number[];
  closedDates: string[];
  scheduleVerified: boolean;
};
export const DEFAULT_SERVICES: StudioService[] = [
  { id: 'podcast', name: 'Podcast', tag: 'Votre voix, votre univers.', duration: 60, price: null, description: 'Une séance pour votre podcast ou votre interview. Le contenu précis de la formule sera confirmé avec le studio.', image: 'studio-session.webp', color: '#eb0606' },
  { id: 'photo', name: 'Shooting photo', tag: 'Le bon regard sur vous.', duration: 60, price: null, description: 'Portrait, produit ou contenu de marque. Précisez votre besoin pour préparer la séance.', image: 'catalogue-photo.webp', color: '#034da5' },
  { id: 'video', name: 'Production vidéo', tag: 'Donnez vie à votre histoire.', duration: 120, price: null, description: 'Une demande de tournage à construire avec l’équipe : format, ambiance et livrables.', image: 'studio-backstage.webp', color: '#996822' },
];
export const DEFAULT_CONFIG: StudioConfig = { services: DEFAULT_SERVICES, open: 8.5, close: 20, closedDays: [0], closedDates: [], scheduleVerified: false };
export function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
export function validEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 180 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
export function slotTimes(time: string, duration: number): string[] {
  const [hour, minute] = time.split(':').map(Number);
  return Array.from({ length: duration / 30 }, (_, index) => {
    const total = hour * 60 + minute + index * 30;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  });
}
export function validateBooking(booking: Record<string, any>, config: StudioConfig, now = Date.now()): StudioService {
  const service = config.services.find(item => item.id === booking.service);
  if (!service) throw Error('Choisissez une prestation valide.');
  if (!validDate(booking.date) || !/^\d{2}:(00|30)$/.test(booking.time || '')) throw Error('Choisissez une date et une heure valides.');
  const start = Date.parse(`${booking.date}T${booking.time}:00Z`);
  if (!Number.isFinite(start) || start < now || start > now + 180 * 86400000) throw Error('Choisissez une date future dans les six prochains mois.');
  const minutes = Number(booking.time.slice(0, 2)) * 60 + Number(booking.time.slice(3));
  if (config.closedDays.includes(new Date(`${booking.date}T12:00:00Z`).getUTCDay()) || (config.closedDates ?? []).includes(booking.date) || minutes < config.open * 60 || minutes + service.duration > config.close * 60) throw Error('Ce créneau est en dehors des horaires du studio.');
  if (typeof booking.name !== 'string' || booking.name.trim().length < 2 || booking.name.length > 100) throw Error('Renseignez votre nom.');
  if (!validEmail(booking.email)) throw Error('Renseignez un e-mail valide.');
  if (typeof booking.phone !== 'string' || !/^\+?[\d\s().-]{6,25}$/.test(booking.phone)) throw Error('Renseignez un numéro de téléphone valide.');
  if (typeof booking.title !== 'string' || booking.title.trim().length < 2 || booking.title.length > 150) throw Error('Donnez un titre à votre séance.');
  if (booking.notes && (typeof booking.notes !== 'string' || booking.notes.length > 3000)) throw Error('Votre message est trop long.');
  return service;
}
export function validateConfig(input: unknown): StudioConfig {
  const config = input as StudioConfig;
  if (!config || !Array.isArray(config.services) || config.services.length !== 3) throw Error('Configuration des prestations invalide.');
  for (const base of DEFAULT_SERVICES) {
    const service = config.services.find(item => item.id === base.id);
    if (!service || !(service.price === null || Number.isSafeInteger(service.price) && service.price >= 0 && service.price <= 100000000) || !Number.isInteger(service.duration) || service.duration < 30 || service.duration > 240 || service.duration % 30) throw Error('Vérifiez les tarifs et les durées (multiples de 30 minutes).');
  }
  if (!Number.isFinite(config.open) || !Number.isFinite(config.close) || !Number.isInteger(config.open * 2) || !Number.isInteger(config.close * 2) || config.open < 0 || config.close > 24 || config.open >= config.close) throw Error('Vérifiez les heures d’ouverture.');
  if (!Array.isArray(config.closedDays) || config.closedDays.some(day => !Number.isInteger(day) || day < 0 || day > 6) || config.closedDays.length === 7) throw Error('Vérifiez les jours de fermeture.');
  const closedDates = Array.isArray(config.closedDates) ? [...new Set(config.closedDates)] : [];
  if (closedDates.length > 100 || closedDates.some(date => !validDate(date))) throw Error('Vérifiez les dates de fermeture exceptionnelle.');
  return { ...DEFAULT_CONFIG, open: config.open, close: config.close, closedDays: [...new Set(config.closedDays)], closedDates, scheduleVerified: config.scheduleVerified === true, services: DEFAULT_SERVICES.map(base => ({ ...base, price: config.services.find(item => item.id === base.id)!.price, duration: config.services.find(item => item.id === base.id)!.duration })) };
}
