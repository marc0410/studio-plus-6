import { database } from '../../../lib/database.ts';
import { getActor, sameOrigin } from '../../../lib/auth.ts';
export const runtime = 'nodejs';
import { DEFAULT_CONFIG, validateBooking, validateConfig, validDate, validEmail, slotTimes } from '../../../lib/studio-domain.ts';
export const dynamic = 'force-dynamic';
type Actor = {
    id: string;
    email: string;
    name: string;
    admin: boolean;
};
async function actor(req: Request): Promise<Actor | null> { return getActor(req); }
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
function db() { return database(); }
async function config() { const row = await db().prepare('SELECT value FROM studio_settings WHERE key = ?').bind('config').first() as { value: string } | null; return row ? validateConfig(JSON.parse(row.value)) : DEFAULT_CONFIG; }
async function accessible(id: string, u: Actor, manage = false) { const b = await db().prepare('SELECT * FROM studio_bookings WHERE id = ?').bind(id).first(); if (!b)
    return null; if (u.admin || b.owner_id === u.id)
    return b; if (manage)
    return null; const p = await db().prepare('SELECT id FROM studio_participants WHERE booking_id = ? AND email = ?').bind(id, u.email).first(); return p ? b : null; }
export async function GET(req: Request) {
    try {
        const url = new URL(req.url), action = url.searchParams.get('action') || 'bootstrap', u = await actor(req), c = await config();
        if (action === 'availability') {
            const date = url.searchParams.get('date');
            if (!validDate(date))
                return json({ error: 'Date invalide.' }, 400);
            const rows = await db().prepare('SELECT time FROM studio_slots WHERE date = ?').bind(date).all();
            return json({ date, occupied: rows.results.map((r: any) => r.time), config: c });
        }
        if (action !== 'bootstrap')
            return json({ error: 'Action inconnue.' }, 404);
        if (!u)
            return json({ me: null, config: c, bookings: [] });
        const result = u.admin ? await db().prepare('SELECT * FROM studio_bookings ORDER BY date DESC,time DESC LIMIT 500').all() : await db().prepare('SELECT DISTINCT b.* FROM studio_bookings b LEFT JOIN studio_participants p ON p.booking_id=b.id WHERE b.owner_id=? OR p.email=? ORDER BY b.date DESC,b.time DESC LIMIT 500').bind(u.id, u.email).all();
        const bookings = await Promise.all(result.results.map(async (b: any) => ({ ...b, canManage: u.admin || b.owner_id === u.id, participants: (await db().prepare('SELECT id,name,email,role FROM studio_participants WHERE booking_id = ?').bind(b.id).all()).results })));
        return json({ me: u, config: c, bookings });
    }
    catch (e) {
        console.error('Studio read error', e);
        return json({ error: 'Impossible de charger les informations du studio. Réessayez dans un instant.' }, 503);
    }
}
async function mutate(req: Request) {
    if (!sameOrigin(req))
        return json({ error: 'Origine de la requête non autorisée.' }, 403);
    const u = await actor(req);
    if (!u)
        return json({ error: 'Connectez-vous pour continuer.' }, 401);
    if (Number(req.headers.get('content-length') || 0) > 20000)
        return json({ error: 'La demande est trop volumineuse.' }, 413);
    let b: any;
    try {
        const raw = await req.text();
        if (raw.length > 20000)
            return json({ error: 'La demande est trop volumineuse.' }, 413);
        b = JSON.parse(raw);
    }
    catch {
        return json({ error: 'Données invalides.' }, 400);
    }
    try {
        if (req.method === 'POST' && b.action === 'booking') {
            const c = await config();
            const service = validateBooking(b, c);
            const id = crypto.randomUUID();
            const pending = await db().prepare("SELECT COUNT(*) AS n FROM studio_bookings WHERE owner_id=? AND status='requested'").bind(u.id).first();
            if (Number(pending?.n || 0) >= 12)
                return json({ error: 'Vous avez déjà 12 demandes en attente. Contactez le studio pour les traiter.' }, 409);
            const statements = [db().prepare('INSERT INTO studio_bookings (id,owner_id,service,title,date,time,duration,amount,status,name,email,phone,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id, u.id, service.id, b.title.trim(), b.date, b.time, service.duration, service.price, 'requested', b.name.trim(), b.email.toLowerCase().trim(), b.phone.trim(), (b.notes || '').trim(), new Date().toISOString())];
            for (const t of slotTimes(b.time, service.duration))
                statements.push(db().prepare('INSERT INTO studio_slots (key,booking_id,date,time) VALUES (?,?,?,?)').bind(b.date + ':' + t, id, b.date, t));
            try {
                await db().batch(statements);
            }
            catch (e) {
                if (String(e).includes('UNIQUE'))
                    return json({ error: 'Ce créneau vient d’être pris. Choisissez-en un autre.' }, 409);
                throw e;
            }
            return json({ id, message: 'Votre demande est enregistrée. Le studio doit encore confirmer la séance et le tarif.' }, 201);
        }
        if (req.method === 'PATCH' && b.action === 'booking') {
            const booking = await accessible(String(b.id || ''), u, true);
            if (!booking)
                return json({ error: 'Séance introuvable ou accès non autorisé.' }, 404);
            if (!['cancelled', 'confirmed'].includes(b.status))
                return json({ error: 'Statut invalide.' }, 400);
            if (b.status === 'confirmed' && !u.admin)
                return json({ error: 'Seul le studio peut confirmer une séance.' }, 403);
            if (booking.status === 'cancelled')
                return json({ error: 'Cette séance est déjà annulée.' }, 409);
            if (b.status === 'confirmed') {
                const amount = b.amount === undefined ? booking.amount : b.amount;
                if (!Number.isSafeInteger(amount) || amount < 0 || amount > 100000000)
                    return json({ error: 'Renseignez le montant total validé avant de confirmer.' }, 400);
                await db().prepare("UPDATE studio_bookings SET status='confirmed',amount=? WHERE id=? AND status!='cancelled'").bind(amount, b.id).run();
            }
            else
                await db().batch([db().prepare("UPDATE studio_bookings SET status='cancelled' WHERE id=?").bind(b.id), db().prepare('DELETE FROM studio_slots WHERE booking_id=?').bind(b.id)]);
            return json({ ok: true });
        }
        if (req.method === 'POST' && b.action === 'participant') {
            const booking = await accessible(String(b.bookingId || ''), u, true);
            if (!booking)
                return json({ error: 'Vous ne pouvez pas modifier les participants de cette séance.' }, 403);
            if (booking.status === 'cancelled')
                return json({ error: 'Cette séance est annulée.' }, 409);
            if (typeof b.name !== 'string' || b.name.trim().length < 2 || b.name.length > 100 || !validEmail(b.email) || !['Invité', 'Co-intervenant', 'Technicien'].includes(b.role))
                return json({ error: 'Vérifiez le nom, l’e-mail et le rôle.' }, 400);
            const count = await db().prepare('SELECT COUNT(*) AS n FROM studio_participants WHERE booking_id=?').bind(b.bookingId).first();
            if (Number(count?.n || 0) >= 20)
                return json({ error: 'Cette séance contient déjà 20 participants.' }, 400);
            try {
                await db().prepare('INSERT INTO studio_participants (id,booking_id,name,email,role) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(), b.bookingId, b.name.trim(), b.email.toLowerCase().trim(), b.role).run();
            }
            catch (e) {
                if (String(e).includes('UNIQUE'))
                    return json({ error: 'Cette personne est déjà ajoutée à la séance.' }, 409);
                throw e;
            }
            return json({ ok: true, message: 'Participant ajouté. Préparez son invitation calendrier pour la lui transmettre.' }, 201);
        }
        if (req.method === 'DELETE' && b.action === 'participant') {
            const booking = await accessible(String(b.bookingId || ''), u, true);
            if (!booking)
                return json({ error: 'Accès non autorisé.' }, 403);
            await db().prepare('DELETE FROM studio_participants WHERE id=? AND booking_id=?').bind(b.id, b.bookingId).run();
            return json({ ok: true });
        }
        if (req.method === 'PATCH' && b.action === 'config') {
            if (!u.admin)
                return json({ error: 'Accès administrateur requis.' }, 403);
            const c = validateConfig(b.config);
            await db().prepare('INSERT INTO studio_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('config', JSON.stringify(c)).run();
            return json({ config: c });
        }
        return json({ error: 'Action inconnue.' }, 400);
    }
    catch (e) {
        if (e instanceof Error && !/D1|SQL|database|binding/i.test(e.message))
            return json({ error: e.message }, 400);
        console.error('Studio write error', e);
        return json({ error: 'L’enregistrement a échoué. Réessayez dans un instant.' }, 503);
    }
}
export const POST = mutate;
export const PATCH = mutate;
export const DELETE = mutate;
