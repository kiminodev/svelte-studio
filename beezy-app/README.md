# Beezy

Equal-split group budget tracker for friends who travel together — built with SvelteKit 2 and Svelte 5.

**Offline-first.** Events and activities are stored in **IndexedDB** on the device. No account, no signal required. A production service worker caches the app shell so the UI can load after the first visit even without a network.

## Documentation

**[PRD.md](./PRD.md)** — full product spec and phased development roadmap.

| Resource | Path |
|----------|------|
| Phase guide & parity checklist | [`PRD.md`](./PRD.md) |
| Visual + behavior reference | [`static/beezy-mockup.html`](./static/beezy-mockup.html) |
| UI components | [`src/lib/components/`](./src/lib/components/) |
| Domain (store, settlement, types) | [`src/lib/beezy/`](./src/lib/beezy/) |
| Design tokens | [`src/lib/styles/`](./src/lib/styles/) |

## Current status

`/` is the real app (single-page controller in `src/routes/+page.svelte`). There is no `/kit` component gallery.

| Phase | Focus | Status |
|-------|--------|--------|
| 1 | Tokens & atoms | Done |
| 2 | App shell | Done |
| 3 | Cards & list molecules | Done |
| 4 | Domain layer (IndexedDB, settlement) | Done |
| 5 | Tab screens | Done |
| 6 | Sheets, forms & menu | Done |
| 7 | Payment & settlement | Done |
| 8 | Polish & ship | Done (`/kit` skipped) |

**Works today:** create/edit events and activities, add/remove participants, hide settled trips, copy receipts, settle/unsettle, About + reset demo, PWA install (production build). CI runs `check`, `test`, and `build` on GitHub Actions.

## Developing

```sh
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173). First visit seeds two demo trips (Boracay + Tagaytay).

```sh
bun run check    # svelte-check + TypeScript
bun test         # settlement unit tests
bun run build    # production build
bun run preview  # preview production build (registers the service worker)
```

## How data flows

```
IndexedDB (`beezy`)  →  loadStore()  →  +page.svelte ($state)
                                          ↓
                                  derived calcs + UI
                                          ↓
User action → store.ts write → refresh events/activities → re-render
```

- Trip data lives in IndexedDB (`events`, `activities`, `meta`).
- Navigation (tab, detail, menu, hide-done) lives in `sessionStorage` (`beezy.view.v1`).
- `store.ts` is a persistence repository, not a Svelte store. Reactive state lives in `+page.svelte`.

## Project layout

```
src/routes/+page.svelte      # app controller — screens, handlers, reactive state
src/service-worker.ts        # production app-shell cache
src/lib/components/          # generic UI (shell, forms, atoms)
src/lib/beezy/               # domain: types, IndexedDB, store, settlement, seed
src/lib/beezy/components/    # event/activity/payment UI
src/lib/assets/favicon.svg
src/lib/styles/              # tokens, primitives, shell, component CSS
static/beezy-mockup.html     # single-file visual/behavior reference
static/manifest.webmanifest  # PWA manifest
```
