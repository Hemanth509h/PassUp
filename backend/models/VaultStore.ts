import crypto from "crypto";

import { getVaultDb } from "../config/sqlite.js";

export type VaultCategory = "login" | "card" | "api_key" | "note";

export interface VaultEntryRecord {
  _id: string;
  userId: string;
  entryID: string;
  title: string;
  category: VaultCategory;
  url?: string;
  username?: string;
  email?: string;
  /** AES-256-GCM ciphertext — never plaintext */
  password: string;
  notes?: string;
  tags: string[];
  strength?: string;
  favorite: boolean;
  /** AES-256-GCM ciphertext of JSON card details */
  cardDetails?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVaultEntryInput {
  userId: string;
  entryID?: string;
  title: string;
  category: VaultCategory;
  url?: string;
  username?: string;
  email?: string;
  password: string;
  notes?: string;
  tags?: string[];
  strength?: string;
  favorite?: boolean;
  cardDetails?: string;
}

type VaultRow = {
  id: string;
  user_id: string;
  entry_id: string;
  title: string;
  category: string;
  url: string | null;
  username: string | null;
  email: string | null;
  password: string;
  notes: string | null;
  tags: string;
  strength: string | null;
  favorite: number;
  card_details: string | null;
  created_at: string;
  updated_at: string;
};

function rowToRecord(row: VaultRow): VaultEntryRecord {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(row.tags || "[]");
    tags = Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    tags = [];
  }

  return {
    _id: row.id,
    userId: row.user_id,
    entryID: row.entry_id,
    title: row.title,
    category: (row.category as VaultCategory) || "login",
    url: row.url ?? undefined,
    username: row.username ?? undefined,
    email: row.email ?? undefined,
    password: row.password,
    notes: row.notes ?? undefined,
    tags,
    strength: row.strength ?? undefined,
    favorite: Boolean(row.favorite),
    cardDetails: row.card_details ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const VaultStore = {
  listByUser(userId: string): VaultEntryRecord[] {
    const rows = getVaultDb()
      .prepare(
        `SELECT * FROM vault_entries
         WHERE user_id = ?
         ORDER BY datetime(created_at) DESC`,
      )
      .all(userId) as VaultRow[];
    return rows.map(rowToRecord);
  },

  findByIdForUser(id: string, userId: string): VaultEntryRecord | null {
    const row = getVaultDb()
      .prepare(
        `SELECT * FROM vault_entries WHERE id = ? AND user_id = ? LIMIT 1`,
      )
      .get(id, userId) as VaultRow | undefined;
    return row ? rowToRecord(row) : null;
  },

  create(input: CreateVaultEntryInput & { id?: string }): VaultEntryRecord {
    const now = new Date().toISOString();
    const id =
      typeof input.id === "string" && input.id.trim()
        ? input.id.trim()
        : crypto.randomUUID();
    const entryID =
      typeof input.entryID === "string" && input.entryID.trim()
        ? input.entryID.trim()
        : crypto.randomUUID();

    getVaultDb()
      .prepare(
        `INSERT INTO vault_entries (
          id, user_id, entry_id, title, category, url, username, email,
          password, notes, tags, strength, favorite, card_details,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?
        )`,
      )
      .run(
        id,
        input.userId,
        entryID,
        input.title,
        input.category,
        input.url ?? null,
        input.username ?? null,
        input.email ?? null,
        input.password,
        input.notes ?? null,
        JSON.stringify(input.tags || []),
        input.strength ?? null,
        input.favorite ? 1 : 0,
        input.cardDetails ?? null,
        now,
        now,
      );

    return this.findByIdForUser(id, input.userId)!;
  },

  /** Insert or replace a full ciphertext record (used by Mongo → SQLite pull). */
  upsertRecord(record: VaultEntryRecord): VaultEntryRecord {
    getVaultDb()
      .prepare(
        `INSERT INTO vault_entries (
          id, user_id, entry_id, title, category, url, username, email,
          password, notes, tags, strength, favorite, card_details,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?
        )
        ON CONFLICT(id) DO UPDATE SET
          user_id = excluded.user_id,
          entry_id = excluded.entry_id,
          title = excluded.title,
          category = excluded.category,
          url = excluded.url,
          username = excluded.username,
          email = excluded.email,
          password = excluded.password,
          notes = excluded.notes,
          tags = excluded.tags,
          strength = excluded.strength,
          favorite = excluded.favorite,
          card_details = excluded.card_details,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at`,
      )
      .run(
        record._id,
        record.userId,
        record.entryID,
        record.title,
        record.category,
        record.url ?? null,
        record.username ?? null,
        record.email ?? null,
        record.password,
        record.notes ?? null,
        JSON.stringify(record.tags || []),
        record.strength ?? null,
        record.favorite ? 1 : 0,
        record.cardDetails ?? null,
        record.createdAt,
        record.updatedAt,
      );

    return this.findByIdForUser(record._id, record.userId)!;
  },

  replaceAllForUser(userId: string, records: VaultEntryRecord[]): number {
    const db = getVaultDb();
    db.prepare(`DELETE FROM vault_entries WHERE user_id = ?`).run(userId);

    const upsert = db.prepare(
      `INSERT INTO vault_entries (
        id, user_id, entry_id, title, category, url, username, email,
        password, notes, tags, strength, favorite, card_details,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    for (const record of records) {
      upsert.run(
        record._id,
        userId,
        record.entryID,
        record.title,
        record.category,
        record.url ?? null,
        record.username ?? null,
        record.email ?? null,
        record.password,
        record.notes ?? null,
        JSON.stringify(record.tags || []),
        record.strength ?? null,
        record.favorite ? 1 : 0,
        record.cardDetails ?? null,
        record.createdAt,
        record.updatedAt,
      );
    }

    return records.length;
  },

  update(
    id: string,
    userId: string,
    patch: Partial<{
      title: string;
      category: VaultCategory;
      url: string | null;
      username: string | null;
      email: string | null;
      password: string;
      notes: string | null;
      tags: string[];
      strength: string | null;
      favorite: boolean;
      cardDetails: string | null;
    }>,
  ): VaultEntryRecord | null {
    const existing = this.findByIdForUser(id, userId);
    if (!existing) return null;

    const next = {
      title: patch.title ?? existing.title,
      category: patch.category ?? existing.category,
      url: patch.url !== undefined ? patch.url : (existing.url ?? null),
      username:
        patch.username !== undefined ? patch.username : (existing.username ?? null),
      email: patch.email !== undefined ? patch.email : (existing.email ?? null),
      password: patch.password ?? existing.password,
      notes: patch.notes !== undefined ? patch.notes : (existing.notes ?? null),
      tags: patch.tags ?? existing.tags,
      strength:
        patch.strength !== undefined ? patch.strength : (existing.strength ?? null),
      favorite:
        patch.favorite !== undefined ? patch.favorite : existing.favorite,
      card_details:
        patch.cardDetails !== undefined
          ? patch.cardDetails
          : (existing.cardDetails ?? null),
      updated_at: new Date().toISOString(),
    };

    getVaultDb()
      .prepare(
        `UPDATE vault_entries SET
          title = ?,
          category = ?,
          url = ?,
          username = ?,
          email = ?,
          password = ?,
          notes = ?,
          tags = ?,
          strength = ?,
          favorite = ?,
          card_details = ?,
          updated_at = ?
         WHERE id = ? AND user_id = ?`,
      )
      .run(
        next.title,
        next.category,
        next.url,
        next.username,
        next.email,
        next.password,
        next.notes,
        JSON.stringify(next.tags),
        next.strength,
        next.favorite ? 1 : 0,
        next.card_details,
        next.updated_at,
        id,
        userId,
      );

    return this.findByIdForUser(id, userId);
  },

  deleteByIdForUser(id: string, userId: string): boolean {
    const result = getVaultDb()
      .prepare(`DELETE FROM vault_entries WHERE id = ? AND user_id = ?`)
      .run(id, userId);
    return Number(result.changes) > 0;
  },

  deleteAllForUser(userId: string): number {
    const result = getVaultDb()
      .prepare(`DELETE FROM vault_entries WHERE user_id = ?`)
      .run(userId);
    return Number(result.changes);
  },
};
