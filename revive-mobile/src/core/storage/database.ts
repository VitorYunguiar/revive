import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import type { BootstrapData, QueuedMutation, QueueOperationType } from '@/domain/types';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDatabase = async () => {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('revive.db').then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS bootstrap_cache (
          user_id TEXT PRIMARY KEY NOT NULL,
          payload TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS mutation_queue (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          type TEXT NOT NULL,
          payload TEXT NOT NULL,
          occurred_at TEXT NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          next_retry_at TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          last_error TEXT
        );
        CREATE INDEX IF NOT EXISTS mutation_queue_user_status
          ON mutation_queue(user_id, status, occurred_at);
        UPDATE mutation_queue SET status = 'pending' WHERE status = 'syncing';
      `);
      return db;
    });
  }
  return databasePromise;
};

export const cacheBootstrap = async (userId: string, data: BootstrapData) => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO bootstrap_cache(user_id, payload, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
    userId,
    JSON.stringify(data),
    new Date().toISOString(),
  );
};

export const getCachedBootstrap = async (userId: string) => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ payload: string }>(
    'SELECT payload FROM bootstrap_cache WHERE user_id = ?',
    userId,
  );
  if (!row) return null;
  try {
    return JSON.parse(row.payload) as BootstrapData;
  } catch {
    return null;
  }
};

export const enqueueMutation = async (
  userId: string,
  type: QueueOperationType,
  payload: Record<string, unknown>,
  occurredAt = new Date().toISOString(),
  id = Crypto.randomUUID(),
) => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO mutation_queue
      (id, user_id, type, payload, occurred_at, attempts, next_retry_at, status)
     VALUES (?, ?, ?, ?, ?, 0, ?, 'pending')`,
    id,
    userId,
    type,
    JSON.stringify(payload),
    occurredAt,
    occurredAt,
  );
  return id;
};

const mapQueueRow = (row: Record<string, unknown>): QueuedMutation => ({
  id: String(row.id),
  userId: String(row.user_id),
  type: String(row.type) as QueueOperationType,
  payload: JSON.parse(String(row.payload)) as Record<string, unknown>,
  occurredAt: String(row.occurred_at),
  attempts: Number(row.attempts),
  nextRetryAt: String(row.next_retry_at),
  status: String(row.status) as QueuedMutation['status'],
  lastError: row.last_error ? String(row.last_error) : null,
});

export const getPendingMutations = async (userId: string) => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM mutation_queue
     WHERE user_id = ? AND status IN ('pending', 'failed')
     ORDER BY occurred_at ASC`,
    userId,
  );
  return rows.map(mapQueueRow);
};

export const countPendingMutations = async (userId: string) => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM mutation_queue
     WHERE user_id = ? AND status IN ('pending', 'failed', 'syncing')`,
    userId,
  );
  return row?.total ?? 0;
};

export const markMutationSyncing = async (id: string) => {
  const db = await getDatabase();
  await db.runAsync(`UPDATE mutation_queue SET status = 'syncing' WHERE id = ?`, id);
};

export const markMutationFailed = async (id: string, attempts: number, error: string, retryable: boolean) => {
  const db = await getDatabase();
  const delayMs = retryable ? Math.min(60_000, 1_000 * 2 ** Math.min(attempts, 6)) : 31_536_000_000;
  await db.runAsync(
    `UPDATE mutation_queue
     SET status = 'failed', attempts = ?, next_retry_at = ?, last_error = ?
     WHERE id = ?`,
    attempts,
    new Date(Date.now() + delayMs).toISOString(),
    error.slice(0, 500),
    id,
  );
};

export const removeMutation = async (id: string) => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM mutation_queue WHERE id = ?', id);
};

export const retryUserMutation = async (userId: string, id: string) => {
  const db = await getDatabase();
  await db.runAsync("UPDATE mutation_queue SET status = 'pending', next_retry_at = ? WHERE user_id = ? AND id = ? AND status = 'failed'", new Date().toISOString(), userId, id);
};

export const discardUserMutation = async (userId: string, id: string) => {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM mutation_queue WHERE user_id = ? AND id = ? AND status != 'syncing'", userId, id);
};

export const clearUserData = async (userId: string) => {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM bootstrap_cache WHERE user_id = ?', userId);
    await db.runAsync('DELETE FROM mutation_queue WHERE user_id = ?', userId);
  });
};
