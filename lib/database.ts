import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

let connection: DatabaseSync | undefined;
export function sqlite(): DatabaseSync {
  if (!connection) {
    const filename = process.env.STUDIO_DATABASE_PATH || './data/studio.sqlite';
    if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true });
    connection = new DatabaseSync(filename);
    connection.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
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
