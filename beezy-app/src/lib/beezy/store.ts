import {
	migrateActivitySettled,
	openDb,
	type MetaRecord,
	STORES,
	type StoreName
} from '$lib/beezy/db';
import { uid } from '$lib/beezy/id';
import { canRemoveParticipant, participantNameTaken } from '$lib/beezy/settlement';
import type { Activity, Event, Participant, Store } from '$lib/beezy/types';

export interface CreateEventInput {
	title: string;
	budget: number;
}

export interface UpdateEventInput {
	title?: string;
	budget?: number;
}

export interface CreateActivityInput {
	name: string;
	price: number;
	eventId: string;
	paidById: string;
}

export interface UpdateActivityInput {
	name?: string;
	price?: number;
	eventId?: string;
	paidById?: string;
}

/** Read the full persisted store. An empty database stays empty (no auto-seed). */
export async function loadStore(): Promise<Store> {
	const [events, activities, meta] = await Promise.all([
		readAll<Event>(STORES.events),
		readAll<Activity>(STORES.activities),
		readOne<MetaRecord>(STORES.meta, 'store')
	]);

	return {
		events: sortByCreatedAtDesc(events),
		activities: activities.map(migrateActivitySettled),
		created: meta?.created ?? Date.now()
	};
}

/** Replace all persisted events, activities, and metadata. */
export async function saveStore(store: Store): Promise<void> {
	const db = await openDb();

	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction([STORES.events, STORES.activities, STORES.meta], 'readwrite');
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error ?? new Error('saveStore transaction aborted'));

		const eventsStore = tx.objectStore(STORES.events);
		const activitiesStore = tx.objectStore(STORES.activities);
		const metaStore = tx.objectStore(STORES.meta);

		eventsStore.clear();
		activitiesStore.clear();

		for (const event of store.events) {
			eventsStore.put(event);
		}
		for (const activity of store.activities) {
			activitiesStore.put(migrateActivitySettled(activity));
		}
		metaStore.put({ key: 'store', created: store.created } satisfies MetaRecord);
	});
}

/** Look up a single event by id. */
export async function getEventById(id: string): Promise<Event | null> {
	const event = await readOne<Event>(STORES.events, id);
	return event ?? null;
}

/** Activities for one event (insertion order from IndexedDB, not sorted). */
export async function getActivitiesFor(eventId: string): Promise<Activity[]> {
	const activities = await readByIndex<Activity>(STORES.activities, 'byEvent', eventId);
	return activities.map(migrateActivitySettled);
}

/** All activities sorted newest-first by `createdAt`. */
export async function getAllActivities(): Promise<Activity[]> {
	const activities = await readAll<Activity>(STORES.activities);
	return sortByCreatedAtDesc(activities.map(migrateActivitySettled));
}

/** Create an event with an empty participant list (mockup `saveEvent`). */
export async function createEvent(input: CreateEventInput): Promise<Event> {
	const event: Event = {
		id: uid(),
		title: input.title.trim(),
		budget: input.budget,
		createdAt: new Date().toISOString(),
		participants: []
	};
	await writeOne(STORES.events, event);
	return event;
}

/** Patch event title and/or budget. */
export async function updateEvent(id: string, input: UpdateEventInput): Promise<Event | null> {
	const existing = await getEventById(id);
	if (!existing) return null;

	const updated: Event = {
		...existing,
		...(input.title !== undefined ? { title: input.title.trim() } : {}),
		...(input.budget !== undefined ? { budget: input.budget } : {})
	};
	await writeOne(STORES.events, updated);
	return updated;
}

/**
 * Delete an event and cascade-delete its activities.
 * Returns `false` when the event id does not exist.
 */
export async function deleteEvent(id: string): Promise<boolean> {
	const db = await openDb();
	let deleted = false;

	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction([STORES.events, STORES.activities], 'readwrite');
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error ?? new Error('deleteEvent transaction aborted'));

		const eventsStore = tx.objectStore(STORES.events);
		const activitiesStore = tx.objectStore(STORES.activities);
		const getReq = eventsStore.get(id);

		getReq.onsuccess = () => {
			if (!getReq.result) return;

			deleted = true;
			eventsStore.delete(id);

			const cursorReq = activitiesStore.index('byEvent').openCursor(IDBKeyRange.only(id));
			cursorReq.onsuccess = () => {
				const cursor = cursorReq.result;
				if (!cursor) return;
				cursor.delete();
				cursor.continue();
			};
			cursorReq.onerror = () => tx.abort();
		};
		getReq.onerror = () => tx.abort();
	});

	return deleted;
}

/**
 * Append a participant to an event.
 * Returns `null` when the event is missing, the name is blank, or the name is
 * already used on this trip (nicknames keep Who-paid receipts unambiguous).
 */
export async function addParticipant(eventId: string, name: string): Promise<Participant | null> {
	const trimmed = name.trim();
	if (!trimmed) return null;

	const event = await getEventById(eventId);
	if (!event) return null;
	if (participantNameTaken(event.participants, trimmed)) return null;

	const participant: Participant = { id: uid(), name: trimmed };
	const updated: Event = {
		...event,
		participants: [...event.participants, participant]
	};
	await writeOne(STORES.events, updated);
	return participant;
}

/**
 * Remove a participant from an event.
 * Returns `false` when the event/id is missing, or when they paid for any
 * activity on that event (same rule as {@link canRemoveParticipant}).
 */
export async function removeParticipant(eventId: string, participantId: string): Promise<boolean> {
	const db = await openDb();
	let removed = false;

	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction([STORES.events, STORES.activities], 'readwrite');
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
		tx.onabort = () =>
			reject(tx.error ?? new Error('removeParticipant transaction aborted'));

		const eventsStore = tx.objectStore(STORES.events);
		const activitiesStore = tx.objectStore(STORES.activities);
		const getReq = eventsStore.get(eventId);

		getReq.onsuccess = () => {
			const event = getReq.result as Event | undefined;
			if (!event) return;
			if (!event.participants.some((p) => p.id === participantId)) return;

			const actsReq = activitiesStore.index('byEvent').getAll(eventId);
			actsReq.onsuccess = () => {
				const activities = (actsReq.result as Activity[]).map(migrateActivitySettled);
				if (!canRemoveParticipant(participantId, activities)) return;

				eventsStore.put({
					...event,
					participants: event.participants.filter((p) => p.id !== participantId)
				});
				removed = true;
			};
			actsReq.onerror = () => tx.abort();
		};
		getReq.onerror = () => tx.abort();
	});

	return removed;
}

/**
 * Create an activity with `settled: false`, resolved `paidByName`, and timestamps.
 * Returns `null` when the event or payer participant is missing.
 */
export async function createActivity(input: CreateActivityInput): Promise<Activity | null> {
	const event = await getEventById(input.eventId);
	if (!event) return null;

	const payer = event.participants.find((p) => p.id === input.paidById);
	if (!payer) return null;

	const now = new Date().toISOString();
	const activity: Activity = {
		id: uid(),
		name: input.name.trim(),
		price: input.price,
		eventId: input.eventId,
		paidById: input.paidById,
		paidByName: payer.name,
		createdAt: now,
		updatedAt: now,
		settled: false
	};
	await writeOne(STORES.activities, activity);
	return activity;
}

/**
 * Update activity fields; refreshes `paidByName` and bumps `updatedAt`.
 * Returns `null` when the activity, event, or payer is missing.
 */
export async function updateActivity(
	id: string,
	input: UpdateActivityInput
): Promise<Activity | null> {
	const existing = await readOne<Activity>(STORES.activities, id);
	if (!existing) return null;

	const eventId = input.eventId ?? existing.eventId;
	const event = await getEventById(eventId);
	if (!event) return null;

	const paidById = input.paidById ?? existing.paidById;
	const payer = event.participants.find((p) => p.id === paidById);
	if (!payer) return null;

	const updated: Activity = {
		...migrateActivitySettled(existing),
		name: input.name !== undefined ? input.name.trim() : existing.name,
		price: input.price ?? existing.price,
		eventId,
		paidById,
		paidByName: payer.name,
		updatedAt: new Date().toISOString()
	};
	await writeOne(STORES.activities, updated);
	return updated;
}

/** Delete a single activity. Returns `false` when the id does not exist. */
export async function deleteActivity(id: string): Promise<boolean> {
	const db = await openDb();
	let deleted = false;

	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction(STORES.activities, 'readwrite');
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);

		const store = tx.objectStore(STORES.activities);
		const getReq = store.get(id);
		getReq.onsuccess = () => {
			if (!getReq.result) return;
			deleted = true;
			store.delete(id);
		};
		getReq.onerror = () => tx.abort();
	});

	return deleted;
}

/** Mark an activity settled and bump `updatedAt`. */
export async function settleActivity(id: string): Promise<Activity | null> {
	const existing = await readOne<Activity>(STORES.activities, id);
	if (!existing) return null;

	const updated: Activity = {
		...migrateActivitySettled(existing),
		settled: true,
		updatedAt: new Date().toISOString()
	};
	await writeOne(STORES.activities, updated);
	return updated;
}

/**
 * Mark every expense this person paid on an event as settled or unpaid.
 * @returns how many rows actually changed
 */
export async function setActivitiesSettledByPayer(
	eventId: string,
	paidById: string,
	settled: boolean
): Promise<number> {
	const db = await openDb();
	let count = 0;
	const now = new Date().toISOString();

	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction(STORES.activities, 'readwrite');
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);

		const store = tx.objectStore(STORES.activities);
		const req = store.index('byEvent').getAll(eventId);
		req.onsuccess = () => {
			const rows = (req.result as Activity[]).map(migrateActivitySettled);
			for (const activity of rows) {
				if (activity.paidById !== paidById) continue;
				if (Boolean(activity.settled) === settled) continue;
				store.put({ ...activity, settled, updatedAt: now });
				count += 1;
			}
		};
		req.onerror = () => tx.abort();
	});

	return count;
}

/** Mark an activity unsettled and bump `updatedAt`. */
export async function unsettleActivity(id: string): Promise<Activity | null> {
	const existing = await readOne<Activity>(STORES.activities, id);
	if (!existing) return null;

	const updated: Activity = {
		...migrateActivitySettled(existing),
		settled: false,
		updatedAt: new Date().toISOString()
	};
	await writeOne(STORES.activities, updated);
	return updated;
}

function sortByCreatedAtDesc<T extends { createdAt: string }>(items: T[]): T[] {
	return items
		.slice()
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function readAll<T>(storeName: StoreName): Promise<T[]> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(storeName, 'readonly');
		const req = tx.objectStore(storeName).getAll();
		req.onsuccess = () => resolve(req.result as T[]);
		req.onerror = () => reject(req.error);
	});
}

async function readOne<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(storeName, 'readonly');
		const req = tx.objectStore(storeName).get(key);
		req.onsuccess = () => resolve(req.result as T | undefined);
		req.onerror = () => reject(req.error);
	});
}

async function readByIndex<T>(
	storeName: StoreName,
	indexName: string,
	key: IDBValidKey
): Promise<T[]> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(storeName, 'readonly');
		const req = tx.objectStore(storeName).index(indexName).getAll(key);
		req.onsuccess = () => resolve(req.result as T[]);
		req.onerror = () => reject(req.error);
	});
}

async function writeOne<T>(storeName: StoreName, value: T): Promise<void> {
	const db = await openDb();
	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction(storeName, 'readwrite');
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
		tx.objectStore(storeName).put(value);
	});
}
