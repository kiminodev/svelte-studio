import type { Activity } from '$lib/beezy/types';

/** IndexedDB database name — not legacy `kkb.store.v1`. */
export const DB_NAME = 'beezy' as const;

/**
 * Bump when object stores or data migrations change.
 * v1: `events`, `activities`, `meta` stores + `settled` flag migration on activities.
 */
export const DB_VERSION = 1 as const;

/**
 * Object store layout (v1, normalized for per-record CRUD in `store.ts`):
 *
 * - `events` — one row per event (`keyPath: id`)
 * - `activities` — one row per expense (`keyPath: id`, index `byEvent` on `eventId`)
 * - `meta` — singleton app metadata (`keyPath: key`), e.g. store `created` timestamp
 */
export const STORES = {
	events: 'events',
	activities: 'activities',
	meta: 'meta'
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

/** Singleton metadata row persisted in the `meta` store. */
export interface MetaRecord {
	key: 'store';
	created: number;
}

/** Typed failure modes for IndexedDB open and transactions. */
export type DbErrorCode = 'unavailable' | 'blocked' | 'quota' | 'upgrade' | 'unknown';

export class DbError extends Error {
	readonly code: DbErrorCode;
	readonly cause?: unknown;

	constructor(code: DbErrorCode, message: string, cause?: unknown) {
		super(message);
		this.name = 'DbError';
		this.code = code;
		this.cause = cause;
	}
}

let dbPromise: Promise<IDBDatabase> | null = null;

/** True when `indexedDB` exists (browser, not private-mode blocked at probe time). */
export function isIndexedDbAvailable(): boolean {
	return typeof indexedDB !== 'undefined';
}

/**
 * Open the Beezy database idempotently — repeated calls share one connection.
 * Rejects with {@link DbError} when storage is unavailable, blocked, or over quota.
 */
export function openDb(): Promise<IDBDatabase> {
	if (!isIndexedDbAvailable()) {
		return Promise.reject(
			new DbError(
				'unavailable',
				'IndexedDB is not available (private browsing or unsupported environment)'
			)
		);
	}

	if (!dbPromise) {
		dbPromise = openDbInternal().catch((err) => {
			dbPromise = null;
			throw err;
		});
	}

	return dbPromise;
}

/** Close the cached connection so the next `openDb()` opens fresh (tests, logout). */
export function closeDb(): void {
	if (dbPromise) {
		void dbPromise.then((db) => db.close()).catch(() => {});
		dbPromise = null;
	}
}

/**
 * Ensure every activity has `settled: boolean`, defaulting to `false`.
 * Mirrors mockup `load()` migration (~lines 572–574).
 */
export function migrateActivitySettled<T extends Pick<Activity, 'settled'>>(
	activity: T
): T & { settled: boolean } {
	if (typeof activity.settled !== 'boolean') {
		return { ...activity, settled: false };
	}
	return activity as T & { settled: boolean };
}

function openDbInternal(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		let request: IDBOpenDBRequest;

		try {
			request = indexedDB.open(DB_NAME, DB_VERSION);
		} catch (err) {
			reject(toDbError(err, 'IndexedDB open threw synchronously'));
			return;
		}

		request.onerror = () => {
			reject(toDbError(request.error, 'Failed to open IndexedDB'));
		};

		request.onblocked = () => {
			reject(
				new DbError(
					'blocked',
					'IndexedDB upgrade blocked — close other tabs using Beezy and retry'
				)
			);
		};

		request.onupgradeneeded = (event) => {
			const db = request.result;
			const tx = request.transaction;
			if (!tx) {
				reject(new DbError('upgrade', 'Upgrade transaction missing during schema migration'));
				return;
			}

			try {
				runMigrations(db, tx, event.oldVersion);
			} catch (err) {
				reject(toDbError(err, 'Schema migration failed'));
			}
		};

		request.onsuccess = () => {
			resolve(request.result);
		};
	});
}

/** Apply versioned schema and data migrations in order. */
function runMigrations(db: IDBDatabase, tx: IDBTransaction, oldVersion: number): void {
	if (oldVersion < 1) {
		createV1Schema(db);
		migrateV1SettledFlag(tx);
	}
}

/** v1: create normalized object stores. */
function createV1Schema(db: IDBDatabase): void {
	if (!db.objectStoreNames.contains(STORES.events)) {
		db.createObjectStore(STORES.events, { keyPath: 'id' });
	}

	if (!db.objectStoreNames.contains(STORES.activities)) {
		const activities = db.createObjectStore(STORES.activities, { keyPath: 'id' });
		activities.createIndex('byEvent', 'eventId', { unique: false });
	}

	if (!db.objectStoreNames.contains(STORES.meta)) {
		db.createObjectStore(STORES.meta, { keyPath: 'key' });
	}
}

/**
 * v1 data migration: backfill `settled: false` on activities missing the flag.
 * Runs on upgrade and is a no-op on fresh installs with an empty store.
 */
function migrateV1SettledFlag(tx: IDBTransaction): void {
	const store = tx.objectStore(STORES.activities);
	const request = store.openCursor();

	request.onsuccess = () => {
		const cursor = request.result;
		if (!cursor) return;

		const activity = cursor.value as Activity;
		if (typeof activity.settled !== 'boolean') {
			cursor.update(migrateActivitySettled(activity));
		}
		cursor.continue();
	};

	request.onerror = () => {
		tx.abort();
	};
}

function toDbError(err: unknown, fallbackMessage: string): DbError {
	if (err instanceof DbError) return err;

	const dom = err as DOMException | null;
	const name = dom?.name ?? '';
	const message = dom?.message || fallbackMessage;

	if (name === 'QuotaExceededError') {
		return new DbError('quota', 'Storage quota exceeded — free space and retry', err);
	}

	if (
		name === 'SecurityError' ||
		message.includes('private') ||
		message.includes('not available')
	) {
		return new DbError('unavailable', message, err);
	}

	if (name === 'AbortError' || name === 'VersionError') {
		return new DbError('upgrade', message, err);
	}

	return new DbError('unknown', message, err);
}
