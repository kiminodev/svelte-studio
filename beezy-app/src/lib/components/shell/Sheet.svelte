<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import { cn } from '$lib/components/cn';

	interface Props {
		open?: boolean;
		title?: string;
		class?: string;
		head?: Snippet;
		body?: Snippet;
		foot?: Snippet;
	}

	let { open = false, title, class: className = '', head, body, foot }: Props = $props();

	let overlay: HTMLDivElement | undefined = $state();

	const FOCUSABLE =
		'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

	function focusables(): HTMLElement[] {
		if (!overlay) return [];
		return [...overlay.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
			(el) => !el.hasAttribute('disabled') && el.getClientRects().length > 0
		);
	}

	/**
	 * Trap Tab inside the overlay while it is open, and restore focus on close.
	 * Required for modal sheets (Phase 8 a11y).
	 */
	$effect(() => {
		if (!open || !overlay) return;

		const root = overlay;
		const previous =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;

		void tick().then(() => {
			focusables()[0]?.focus();
		});

		function onKeyDown(event: KeyboardEvent) {
			if (event.key !== 'Tab') return;

			const items = focusables();
			if (items.length === 0) {
				event.preventDefault();
				root.focus();
				return;
			}

			const first = items[0];
			const last = items[items.length - 1];
			const active = document.activeElement;

			if (event.shiftKey) {
				if (active === first || active === root || !root.contains(active)) {
					event.preventDefault();
					last.focus();
				}
			} else if (active === last || active === root || !root.contains(active)) {
				event.preventDefault();
				first.focus();
			}
		}

		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			if (previous && document.contains(previous)) previous.focus();
		};
	});
</script>

<div
	bind:this={overlay}
	class={cn('overlay', !open && 'hidden', className)}
	role="dialog"
	aria-modal="true"
	aria-hidden={!open}
	tabindex="-1"
>
	{#if head}
		{@render head()}
	{:else if title}
		<div class="sheet-head">
			<h3>{title}</h3>
		</div>
	{/if}
	{#if body}
		<div class="sheet-body">
			{@render body()}
		</div>
	{/if}
	{#if foot}
		<div class="sheet-foot">
			{@render foot()}
		</div>
	{/if}
</div>
