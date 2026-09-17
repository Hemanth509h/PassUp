 import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDbPath = path.join(__dirname, "..", "data", "vault.sqlite");

let db: DatabaseSync | null = null;

/**
 * SQLite holds encrypted vault secrets only.
 * The Master Key is never written to this database (or anywhere else).
 */
export function getVaultDb(): DatabaseSync {
  if (db) return db;

  const dbPath = process.env.SQLITE_PATH?.trim() || defaultDbPath;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS vault_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      entry_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'login',
      url TEXT,
      username TEXT,
      email TEXT,
      password TEXT NOT NULL,
      notes TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      strength TEXT,
      favorite INTEGER NOT NULL DEFAULT 0,
      card_details TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_vault_entries_user_id
      ON vault_entries(user_id);
  `);

  console.log(`SQLite vault store ready at ${dbPath}`);
  return db;
}

export function closeVaultDb(): void {
  if (!db) return;
  db.close();
  db = null;
}
