<script lang="ts">
	import { cn } from '$lib/ui/cn';

	interface Props {
		message?: string;
		open?: boolean;
		class?: string;
	}

	let { message = '', open = false, class: className = '' }: Props = $props();
</script>

<div
	class={cn('toast', open && 'show', className)}
	role="status"
	aria-live="polite"
	aria-hidden={!open}
>
	{message}
</div>
