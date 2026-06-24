<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/ui/cn';

	interface Props {
		open?: boolean;
		class?: string;
		children?: Snippet;
		onclose?: () => void;
	}

	let { open = false, class: className = '', children, onclose }: Props = $props();

	let popover = $state<HTMLDivElement | null>(null);

	/** Close when clicking outside the popover and outside `[data-menu-trigger]`. */
	$effect(() => {
		if (!open) return;

		const onPointerDown = (event: PointerEvent) => {
			const target = event.target as Node;
			if (popover?.contains(target)) return;
			if ((event.target as Element | null)?.closest('[data-menu-trigger], .menu-trigger')) return;
			onclose?.();
		};

		const id = window.setTimeout(() => {
			document.addEventListener('pointerdown', onPointerDown);
		}, 0);

		return () => {
			window.clearTimeout(id);
			document.removeEventListener('pointerdown', onPointerDown);
		};
	});
</script>

<div bind:this={popover} class={cn('menu-pop', !open && 'hidden', className)}>
	{@render children?.()}
</div>
