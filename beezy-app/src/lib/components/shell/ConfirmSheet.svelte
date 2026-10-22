<script lang="ts">
	import Button from '../forms/Button.svelte';
	import Sheet from './Sheet.svelte';

	/** In-app "Are you sure?" prompt for permanent deletes. Sits above other sheets. */

	interface Props {
		open?: boolean;
		title?: string;
		message?: string;
		confirmLabel?: string;
		oncancel?: () => void;
		onconfirm?: () => void;
	}

	let {
		open = false,
		title = 'Are you sure?',
		message = 'This cannot be undone.',
		confirmLabel = 'Delete',
		oncancel,
		onconfirm
	}: Props = $props();

	/** Escape cancels so a mis-tap is easy to back out of. */
	$effect(() => {
		if (!open) return;

		function onKeyDown(event: KeyboardEvent) {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			oncancel?.();
		}

		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	});
</script>

<Sheet {open} class="overlay-confirm">
	{#snippet body()}
		<div class="confirm-card">
			<h3>{title}</h3>
			<p class="confirm-copy">{message}</p>
			<div class="confirm-actions">
				<Button variant="secondary" onclick={oncancel}>Cancel</Button>
				{#if confirmLabel}
					<Button variant="danger" onclick={onconfirm}>{confirmLabel}</Button>
				{/if}
			</div>
		</div>
	{/snippet}
</Sheet>
