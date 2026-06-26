import type { Store } from '$lib/beezy/types';

/**
 * Demo trips (Boracay + Tagaytay) for first-run and `resetDemo()`.
 * Ported from mockup `seedData()` (~lines 528–561).
 */
export function seedData(): Store {
	const now = Date.now();
	const iso = (d: string) => new Date(d).toISOString();

	return {
		events: [
			{
				id: 'e1',
				title: 'Boracay Getaway',
				budget: 24000,
				createdAt: iso('2026-06-05T20:00:00'),
				participants: [
					{ id: 'p1', name: 'Mika' },
					{ id: 'p2', name: 'Jomar' },
					{ id: 'p3', name: 'Andrea' },
					{ id: 'p4', name: 'Paolo' }
				]
			},
			{
				id: 'e2',
				title: 'Tagaytay Roadtrip',
				budget: 6000,
				createdAt: iso('2026-05-29T19:00:00'),
				participants: [
					{ id: 'p5', name: 'Mika' },
					{ id: 'p6', name: 'Jomar' },
					{ id: 'p7', name: 'Lia' }
				]
			}
		],
		activities: [
			{
				id: 'a1',
				eventId: 'e1',
				name: 'Beachfront Resort (2 nights)',
				price: 8000,
				paidById: 'p1',
				paidByName: 'Mika',
				createdAt: iso('2026-06-06T14:00:00'),
				updatedAt: iso('2026-06-06T14:05:00'),
				settled: false
			},
			{
				id: 'a2',
				eventId: 'e1',
				name: 'Island Hopping Tour',
				price: 3600,
				paidById: 'p2',
				paidByName: 'Jomar',
				createdAt: iso('2026-06-07T08:30:00'),
				updatedAt: iso('2026-06-07T08:30:00'),
				settled: false
			},
			{
				id: 'a3',
				eventId: 'e1',
				name: 'Tricycles & Transpo',
				price: 1200,
				paidById: 'p4',
				paidByName: 'Paolo',
				createdAt: iso('2026-06-07T09:10:00'),
				updatedAt: iso('2026-06-07T09:10:00'),
				settled: false
			},
			{
				id: 'a4',
				eventId: 'e1',
				name: 'Dinner — Real Coffee & Tea',
				price: 2400,
				paidById: 'p3',
				paidByName: 'Andrea',
				createdAt: iso('2026-06-07T20:10:00'),
				updatedAt: iso('2026-06-07T20:45:00'),
				settled: false
			},
			{
				id: 'a5',
				eventId: 'e1',
				name: 'Parasailing (2 pax)',
				price: 5000,
				paidById: 'p1',
				paidByName: 'Mika',
				createdAt: iso('2026-06-08T11:00:00'),
				updatedAt: iso('2026-06-08T11:00:00'),
				settled: false
			},
			{
				id: 'a6',
				eventId: 'e1',
				name: 'Sunset Bar Tab',
				price: 2800,
				paidById: 'p2',
				paidByName: 'Jomar',
				createdAt: iso('2026-06-08T18:45:00'),
				updatedAt: iso('2026-06-08T19:02:00'),
				settled: false
			},
			{
				id: 'a7',
				eventId: 'e2',
				name: 'Gas & SLEX Toll',
				price: 1500,
				paidById: 'p6',
				paidByName: 'Jomar',
				createdAt: iso('2026-06-01T07:00:00'),
				updatedAt: iso('2026-06-01T07:00:00'),
				settled: false
			},
			{
				id: 'a8',
				eventId: 'e2',
				name: 'Bulalohan Lunch',
				price: 1800,
				paidById: 'p5',
				paidByName: 'Mika',
				createdAt: iso('2026-06-01T13:00:00'),
				updatedAt: iso('2026-06-01T13:00:00'),
				settled: false
			},
			{
				id: 'a9',
				eventId: 'e2',
				name: 'Coffee — Bag of Beans',
				price: 900,
				paidById: 'p7',
				paidByName: 'Lia',
				createdAt: iso('2026-06-01T16:00:00'),
				updatedAt: iso('2026-06-01T16:00:00'),
				settled: false
			}
		],
		created: now
	};
}
