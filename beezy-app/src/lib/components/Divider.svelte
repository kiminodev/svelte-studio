<script lang="ts">
	import { cn } from '$lib/components/ui/cn';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<hr class={cn('divider-rule', className)} />
