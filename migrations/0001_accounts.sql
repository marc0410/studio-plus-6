CREATE TABLE app_users (
 id TEXT PRIMARY KEY,
 email TEXT UNIQUE NOT NULL,
 name TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 admin INTEGER NOT NULL DEFAULT 0 CHECK(admin IN (0,1))
);
CREATE TABLE app_sessions (
 token_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_expiry ON app_sessions(expires_at);
CREATE TABLE app_login_attempts (
 email TEXT PRIMARY KEY,
 window_start INTEGER NOT NULL,
 attempts INTEGER NOT NULL
);
