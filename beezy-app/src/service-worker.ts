/// <reference types="@sveltejs/kit" />
import { build, files, prerendered, version } from '$service-worker';

/**
 * App-shell cache for Beezy. Precaches hashed build output + static assets
 * so the SPA can load offline after the first visit. IndexedDB trip data is
 * already local and is not handled here.
 *
 * SvelteKit only bundles this worker in production (`bun run preview` / deploy).
 */
const CACHE = `beezy-${version}`;

const ASSETS = [...build, ...files, ...prerendered];

self.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	async function respond(): Promise<Response> {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		if (ASSETS.includes(url.pathname)) {
			const cached = await cache.match(url.pathname);
			if (cached) return cached;
		}

		try {
			const response = await fetch(event.request);
			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch');
			}

			if (response.status === 200 && !response.headers.get('cache-control')?.includes('no-store')) {
				void cache.put(event.request, response.clone());
			}

			return response;
		} catch (error) {
			const cached = await cache.match(event.request);
			if (cached) return cached;
			throw error;
		}
	}

	event.respondWith(respond());
});
