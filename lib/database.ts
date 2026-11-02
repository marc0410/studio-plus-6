import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

let connection: DatabaseSync | undefined;

function ensureSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS studio_bookings (
      id TEXT PRIMARY KEY NOT NULL,
      owner_id TEXT NOT NULL,
      service TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      duration INTEGER NOT NULL,
      amount INTEGER,
      status TEXT DEFAULT 'requested' NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      notes TEXT DEFAULT '' NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS bookings_owner ON studio_bookings(owner_id);
    CREATE INDEX IF NOT EXISTS bookings_date ON studio_bookings(date);

    CREATE TABLE IF NOT EXISTS studio_participants (
      id TEXT PRIMARY KEY NOT NULL,
      booking_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT DEFAULT 'Invité' NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES studio_bookings(id)
        ON UPDATE NO ACTION ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS participants_unique
      ON studio_participants(booking_id, email);
    CREATE INDEX IF NOT EXISTS participants_email
      ON studio_participants(email);

    CREATE TABLE IF NOT EXISTS studio_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS studio_slots (
      key TEXT PRIMARY KEY NOT NULL,
      booking_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES studio_bookings(id)
        ON UPDATE NO ACTION ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      admin INTEGER NOT NULL DEFAULT 0 CHECK(admin IN (0, 1))
    );
    CREATE TABLE IF NOT EXISTS app_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry ON app_sessions(expires_at);
    CREATE TABLE IF NOT EXISTS app_login_attempts (
      email TEXT PRIMARY KEY,
      window_start INTEGER NOT NULL,
      attempts INTEGER NOT NULL
    );
  `);
}

export function sqlite(): DatabaseSync {
  if (!connection) {
    // Vercel's application bundle is read-only. /tmp is writable there, while
    // local development keeps using the repository's data directory.
    const filename = process.env.STUDIO_DATABASE_PATH
      || (process.env.VERCEL === '1' ? '/tmp/studio.sqlite' : './data/studio.sqlite');
    if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true });
    connection = new DatabaseSync(filename);
    connection.exec(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = ${process.env.VERCEL === '1' ? 'DELETE' : 'WAL'}; PRAGMA busy_timeout = 5000;`);
    // Vercel does not run the standalone migration script before invoking a
    // server function, so bootstrap its ephemeral runtime database here.
    if (process.env.VERCEL === '1') ensureSchema(connection);
  }
  return connection;
}
function prepare(sql: string) {
  let args: any[] = [];
  return {
    bind(...values: any[]) { args = values; return this; },
    async first() { return sqlite().prepare(sql).get(...args) || null; },
    async all() { return { results: sqlite().prepare(sql).all(...args) }; },
    async run() { return this.execute(); },
    execute() { return sqlite().prepare(sql).run(...args); },
  };
}
export function database() {
  return {
    prepare,
    async batch(statements: ReturnType<typeof prepare>[]) {
      const db = sqlite();
      db.exec('BEGIN IMMEDIATE');
      try {
        const results = statements.map(statement => statement.execute());
        db.exec('COMMIT');
        return results;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
export function migrate() {
  const db = sqlite();
  db.exec('CREATE TABLE IF NOT EXISTS app_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  const folder = resolve('migrations');
  for (const name of readdirSync(folder).filter(file => file.endsWith('.sql')).sort()) {
    if (db.prepare('SELECT name FROM app_migrations WHERE name=?').get(name)) continue;
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(readFileSync(resolve(folder, name), 'utf8'));
      db.prepare('INSERT INTO app_migrations VALUES (?,?)').run(name, new Date().toISOString());
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}
