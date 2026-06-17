# Beezy

Equal-split group budget tracker for friends who travel together — built with SvelteKit 2 and Svelte 5.

**Offline-first.** Events and activities are stored in **IndexedDB** on the device. No account, no signal required.

## Documentation

**[PRD.md](./PRD.md)** — full product spec and phased development roadmap. Use this as your checklist from atoms through ship.

| Resource | Path |
|----------|------|
| Phase guide & parity checklist | [`PRD.md`](./PRD.md) |
| Visual + behavior reference | [`static/beezy-mockup.html`](./static/beezy-mockup.html) |
| UI components | [`src/lib/components/ui/`](./src/lib/components/ui/) |
| Design tokens | [`src/lib/styles/`](./src/lib/styles/) |

## Current status

| Phase | Focus | Status |
|-------|--------|--------|
| 1 | Tokens & atoms | Done |
| 2 | App shell | In progress |
| 3–8 | Cards, domain, screens, payment, polish | See [PRD.md](./PRD.md) |

## Developing

```sh
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) — the home page is currently the UI component showcase.

```sh
bun run check    # svelte-check + TypeScript
bun run build    # production build
bun run preview  # preview production build
```

## Project layout

```
src/lib/components/ui/   # Svelte UI kit
src/lib/styles/          # tokens, primitives, shell CSS
src/lib/beezy/           # domain helpers (settlement, store — Phase 4+)
static/beezy-mockup.html # single-file reference app (legacy KKB naming inside)
```
