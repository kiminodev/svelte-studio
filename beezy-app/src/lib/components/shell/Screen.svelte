<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/cn';

	interface Props {
		class?: string;
		/** Extra classes on the inner `.screen` padding wrapper. */
		innerClass?: string;
		children?: Snippet;
	}

	let { class: className = '', innerClass = '', children }: Props = $props();
</script>

<main class={cn('content', className)}>
	<div class={cn('screen', innerClass)}>
		{@render children?.()}
	</div>
</main>
