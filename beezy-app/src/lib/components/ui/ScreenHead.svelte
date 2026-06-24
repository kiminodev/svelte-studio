<script lang="ts">
	import { cn } from '$lib/ui/cn';

	interface Props {
		title: string;
		description?: string;
		class?: string;
	}

	let { title, description, class: className = '' }: Props = $props();
</script>

<div class={cn('screen-head', className)}>
	<h2>{title}</h2>
	{#if description}<p>{description}</p>{/if}
</div>
