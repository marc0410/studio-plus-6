import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
process.env.STUDIO_DATABASE_PATH = ':memory:';
process.env.APP_URL = 'http://localhost:3000';
const { database, migrate, sqlite } = await import('../lib/database.ts');
const { createUser, getActor, sameOrigin, login, logout } = await import('../lib/auth.ts');
const domain = await import('../lib/studio-domain.ts');
migrate();

const text = readFileSync(new URL('../app/api/studio/route.ts', import.meta.url), 'utf8')
  .replace(/^import .*;$/gm, '').replace(/export /g, '');
const source = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const api = new Function('database', 'getActor', 'sameOrigin', ...Object.keys(domain), source + ';return {GET,POST,PATCH,DELETE};')
  (database, getActor, sameOrigin, ...Object.values(domain));
const origin = 'http://localhost:3000';
const password = 'Fixture-only-password-2026';
function request(method, data, cookie = '', extra = {}, query = '') {
  return new Request(origin + '/api/studio' + query, { method,
    headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie, ...extra },
    ...(method === 'GET' ? {} : { body: JSON.stringify(data) }),
  });
}
async function account(email, admin = false) {
  await createUser({ email, name: 'Test Studio', password, admin });
  const response = await login(request('POST', { email, password }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);
  return response.headers.get('set-cookie').split(';')[0];
}
async function call(method, data, cookie, expected = 200, query = '', headers = {}) {
  const response = await api[method](request(method, data, cookie, headers, query));
  const result = await response.json();
  assert.equal(response.status, expected, JSON.stringify(result));
  return result;
}

test('date validation and half-hour overlap calculation', () => {
  assert.equal(domain.validDate('2026-02-30'), false);
  assert.deepEqual(domain.slotTimes('10:30', 90), ['10:30', '11:00', '11:30']);
});

test('sessions, bookings, permissions, transaction rollback and cancellation', async () => {
  const owner = await account('owner@example.test');
  const other = await account('other@example.test');
  const guest = await account('guest@example.test');
  const admin = await account('admin@example.test', true);
  const date = new Date(Date.now() + 3 * 86400000);
  while (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1);
  const payload = { action: 'booking', service: 'podcast', date: date.toISOString().slice(0, 10), time: '10:00', name: 'Test Client', email: 'owner@example.test', phone: '+2250102030405', title: 'Test podcast', notes: '' };
  await call('POST', payload, '', 401);
  const spoofed = await call('GET', null, '', 200, '', { 'oai-authenticated-user-id': 'fake', 'oai-authenticated-user-email': 'admin@example.test' });
  assert.equal(spoofed.me, null, 'Legacy hosting headers must never authenticate users');
  await call('POST', payload, owner, 403, '', { Origin: 'https://attacker.test' });
  const booking = await call('POST', payload, owner, 201);
  await call('POST', { ...payload, time: '10:30' }, other, 409);
  assert.equal((await call('GET', null, other)).bookings.length, 0, 'Failed overlap rolls back the whole booking');
  assert.equal((await call('GET', null, owner)).bookings.length, 1);
  await call('PATCH', { action: 'booking', id: booking.id, status: 'confirmed', amount: 30000 }, owner, 403);
  await call('PATCH', { action: 'booking', id: booking.id, status: 'cancelled' }, other, 404);
  await call('POST', { action: 'participant', bookingId: booking.id, name: 'Guest Test', email: 'guest@example.test', role: 'Invité' }, owner, 201);
  const invited = await call('GET', null, guest);
  assert.equal(invited.bookings.length, 1);
  assert.equal(invited.bookings[0].canManage, false);
  await call('POST', { action: 'participant', bookingId: booking.id, name: 'Other Test', email: 'other@example.test', role: 'Invité' }, guest, 403);
  await call('PATCH', { action: 'config', config: domain.DEFAULT_CONFIG }, owner, 403);
  await call('PATCH', { action: 'config', config: { ...domain.DEFAULT_CONFIG, scheduleVerified: true } }, admin);
  await call('PATCH', { action: 'booking', id: booking.id, status: 'confirmed' }, admin, 400);
  await call('PATCH', { action: 'booking', id: booking.id, status: 'confirmed', amount: 30000 }, admin);
  assert.equal((await call('GET', null, owner)).bookings[0].amount, 30000);
  await call('PATCH', { action: 'booking', id: booking.id, status: 'cancelled' }, owner);
  assert.equal((await call('GET', null, '', 200, '?action=availability&date=' + payload.date)).occupied.length, 0);
  await call('POST', payload, other, 201);
  assert.equal((await logout(request('POST', {}, owner))).status, 200);
  assert.equal(await getActor(request('GET', null, owner)), null);
  sqlite().prepare('UPDATE app_sessions SET expires_at=0').run();
  assert.equal(await getActor(request('GET', null, admin)), null);
});

test('login rejects wrong passwords, cross-origin requests and repeated failures', async () => {
  const input = { email: 'unknown@example.test', password };
  assert.equal((await login(request('POST', input, '', { Origin: 'https://attacker.test' }))).status, 403);
  for (let n = 0; n < 8; n++) assert.equal((await login(request('POST', input))).status, 401);
  assert.equal((await login(request('POST', input))).status, 429);
  assert.equal((await login(request('POST', { email: 'owner@example.test', password: 'incorrect' }))).status, 401);
});
