<script lang="ts">
	import type { IconName } from '$lib/ui/icons/types';

	interface Props {
		name: IconName;
		class?: string;
	}

	let { name, class: className = '' }: Props = $props();
</script>

{#if name === 'activities'}
	<svg class={className} viewBox="0 0 24 24">
		<rect x="5" y="4" width="14" height="17" rx="2" />
		<path d="M9 3.5h6v3H9z" />
		<path d="M8.5 10h7M8.5 13.5h7M8.5 17h4.5" />
	</svg>
{:else if name === 'events'}
	<svg class={className} viewBox="0 0 24 24">
		<path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
		<circle cx="12" cy="9" r="2.4" />
	</svg>
{:else if name === 'payment'}
	<svg class={className} viewBox="0 0 24 24">
		<path d="M6 3h12v18l-2.2-1.3-2 1.3-1.8-1.3L9.8 21 8 19.7 6 21V3Z" />
		<path d="M9 8.5h6M9 12h6M9 15.5h3.5" />
	</svg>
{:else if name === 'plus'}
	<svg class={className} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
{:else if name === 'receipt'}
	<svg class={className} viewBox="0 0 24 24">
		<path d="M6 3h12v18l-2.2-1.3-2 1.3-1.8-1.3L9.8 21 8 19.7 6 21V3Z" />
		<path d="M9 8.5h6M9 12h4" />
	</svg>
{:else if name === 'more'}
	<svg class={className} viewBox="0 0 24 24">
		<circle cx="12" cy="5" r="1.6" />
		<circle cx="12" cy="12" r="1.6" />
		<circle cx="12" cy="19" r="1.6" />
	</svg>
{:else if name === 'back'}
	<svg class={['back-arrow', className].filter(Boolean).join(' ')} viewBox="0 0 24 24">
		<path d="M15 5l-7 7 7 7" />
	</svg>
{:else if name === 'close'}
	<svg
		class={className}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
	>
		<path d="M6 6l12 12M18 6L6 18" />
	</svg>
{:else if name === 'copy'}
	<svg
		class={className}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.7"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<rect x="9" y="9" width="11" height="11" rx="2" />
		<path d="M5 15V5a2 2 0 0 1 2-2h8" />
	</svg>
{:else if name === 'trash'}
	<svg class={className} viewBox="0 0 24 24">
		<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
	</svg>
{:else if name === 'refresh'}
	<svg class={className} viewBox="0 0 24 24">
		<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4" />
		<path d="M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4" />
	</svg>
{:else if name === 'info'}
	<svg class={className} viewBox="0 0 24 24">
		<circle cx="12" cy="12" r="9" />
		<path d="M12 11v5M12 7.5v.5" />
	</svg>
{:else if name === 'chev'}
	<svg
		class={className}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.7"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M9 6l6 6-6 6" />
	</svg>
{:else if name === 'x'}
	<svg
		class={className}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
	>
		<path d="M6 6l12 12M18 6L6 18" />
	</svg>
{:else if name === 'check'}
	<svg
		class={className}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M5 12l5 5L20 6" />
	</svg>
{/if}
