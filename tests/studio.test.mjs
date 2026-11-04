import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, slotTimes, validDate, validateBooking, validateConfig } from '../lib/studio-domain.ts';

const now = Date.parse('2026-11-03T09:00:00Z');
const booking = {
  service: 'podcast', date: '2026-11-04', time: '10:00',
  name: 'Client Studio', email: 'client@example.com', phone: '+2250102030405', title: 'Séance podcast',
};

test('dates et créneaux de 30 minutes', () => {
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(validDate('2026-11-04'), true);
  assert.deepEqual(slotTimes('10:30', 90), ['10:30', '11:00', '11:30']);
});

test('une réservation valide suit le catalogue serveur', () => {
  const service = validateBooking(booking, DEFAULT_CONFIG, now);
  assert.equal(service.id, 'podcast');
  assert.equal(service.duration, 60);
  assert.equal(service.price, null);
});

test('rejette une date passée et un créneau hors ouverture', () => {
  assert.throws(() => validateBooking({ ...booking, date: '2026-11-02' }, DEFAULT_CONFIG, now), /date future/);
  assert.throws(() => validateBooking({ ...booking, time: '20:00' }, DEFAULT_CONFIG, now), /horaires/);
});

test('rejette un jour fermé, une heure mal formée et un service inconnu', () => {
  assert.throws(() => validateBooking({ ...booking, date: '2026-11-08' }, DEFAULT_CONFIG, now), /horaires/);
  assert.throws(() => validateBooking({ ...booking, time: '10:15' }, DEFAULT_CONFIG, now), /date et une heure/);
  assert.throws(() => validateBooking({ ...booking, service: 'inconnu' }, DEFAULT_CONFIG, now), /prestation/);
});

test('rejette les champs personnels invalides', () => {
  assert.throws(() => validateBooking({ ...booking, email: 'non-valide' }, DEFAULT_CONFIG, now), /e-mail/);
  assert.throws(() => validateBooking({ ...booking, phone: '12' }, DEFAULT_CONFIG, now), /téléphone/);
  assert.throws(() => validateBooking({ ...booking, notes: 'x'.repeat(3001) }, DEFAULT_CONFIG, now), /trop long/);
});

test('la configuration conserve les prestations officielles et valide durées/prix', () => {
  const config = validateConfig({ ...DEFAULT_CONFIG, services: DEFAULT_CONFIG.services.map(service => ({ ...service, duration: 90, price: 50000 })) });
  assert.equal(config.services[0].duration, 90);
  assert.equal(config.services[0].price, 50000);
  assert.throws(() => validateConfig({ ...DEFAULT_CONFIG, services: DEFAULT_CONFIG.services.map(service => ({ ...service, duration: 45 })) }), /durées/);
  assert.throws(() => validateConfig({ ...DEFAULT_CONFIG, closedDays: [0, 1, 2, 3, 4, 5, 6] }), /fermeture/);
});
