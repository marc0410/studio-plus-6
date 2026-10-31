import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { sqlite } from './database.ts';
import { validEmail } from './studio-domain.ts';

const derive = promisify(scrypt) as (password: string, salt: string, keyLength: number) => Promise<Buffer>;
export const COOKIE = 'studio_session';
const TTL = 7 * 86400;
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
type UserInput = { email: string; name: string; password: string; admin?: boolean };
export type Actor = { id: string; email: string; name: string; admin: boolean };

export async function createUser({ email, name, password, admin = false }: UserInput): Promise<string> {
  email = email.trim().toLowerCase();
  if (!validEmail(email) || name.trim().length < 2 || name.length > 100) throw Error('Nom ou e-mail invalide.');
  if (password.length < 12 || password.length > 200) throw Error('Le mot de passe doit contenir entre 12 et 200 caractères.');
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64);
  const id = randomUUID();
  sqlite().prepare('INSERT INTO app_users (id,email,name,password_hash,admin) VALUES (?,?,?,?,?)').run(id, email, name.trim(), `${salt}:${hash.toString('hex')}`, admin ? 1 : 0);
  return id;
}
function sessionToken(request: Request): string | null {
  const part = (request.headers.get('cookie') || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${COOKIE}=`));
  const token = part?.slice(COOKIE.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export async function getActor(request: Request): Promise<Actor | null> {
  const token = sessionToken(request);
  if (!token) return null;
  const row = sqlite().prepare('SELECT u.id,u.email,u.name,u.admin FROM app_sessions s JOIN app_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(digest(token), Date.now()) as Record<string, unknown> | undefined;
  if (!row) return null;
  return { id: String(row.id), email: String(row.email), name: String(row.name), admin: row.admin === 1 };
}
export function sameOrigin(request: Request): boolean {
  const expected = process.env.APP_URL ? new URL(process.env.APP_URL).origin : new URL(request.url).origin;
  return request.headers.get('origin') === expected;
}
function cookie(token: string, clear = false): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : TTL}${secure}`;
}
export async function login(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return Response.json({ error: 'Origine non autorisée.' }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 4096) return Response.json({ error: 'Demande trop volumineuse.' }, { status: 413 });
  let input: Record<string, unknown>;
  try { input = JSON.parse(raw); } catch { return Response.json({ error: 'Données invalides.' }, { status: 400 }); }
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!validEmail(email) || typeof input.password !== 'string' || input.password.length > 200) return Response.json({ error: 'Identifiants invalides.' }, { status: 400 });
  const db = sqlite();
  const windowStart = Math.floor(Date.now() / 900000) * 900000;
  db.prepare('DELETE FROM app_login_attempts WHERE window_start<?').run(windowStart);
  db.prepare('INSERT INTO app_login_attempts (email,window_start,attempts) VALUES (?,?,1) ON CONFLICT(email) DO UPDATE SET attempts=attempts+1').run(email, windowStart);
  const attempts = db.prepare('SELECT attempts FROM app_login_attempts WHERE email=?').get(email) as { attempts: number } | undefined;
  if (Number(attempts?.attempts) > 8) return Response.json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, { status: 429 });
  const user = db.prepare('SELECT * FROM app_users WHERE email=?').get(email) as { id: string; password_hash: string } | undefined;
  const [salt, expected] = String(user?.password_hash || `00000000000000000000000000000000:${'00'.repeat(64)}`).split(':');
  const actual = await derive(input.password, salt, 64);
  if (!user || !timingSafeEqual(actual, Buffer.from(expected, 'hex'))) return Response.json({ error: 'E-mail ou mot de passe incorrect.' }, { status: 401 });
  db.prepare('DELETE FROM app_login_attempts WHERE email=?').run(email);
  db.prepare('DELETE FROM app_sessions WHERE expires_at<?').run(Date.now());
  const token = randomBytes(32).toString('hex');
  db.prepare('INSERT INTO app_sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').run(digest(token), user.id, Date.now() + TTL * 1000);
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': cookie(token), 'Cache-Control': 'no-store' } });
}
export async function logout(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return Response.json({ error: 'Origine non autorisée.' }, { status: 403 });
  const token = sessionToken(request);
  if (token) sqlite().prepare('DELETE FROM app_sessions WHERE token_hash=?').run(digest(token));
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': cookie('', true), 'Cache-Control': 'no-store' } });
}
