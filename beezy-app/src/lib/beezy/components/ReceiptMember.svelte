<script lang="ts">
	import { peso } from '$lib/beezy/format';
	import { Avatar, cn } from '$lib/components';

	interface Props {
		name: string;
		owesTo: string;
		amount: number;
		class?: string;
	}

	let { name, owesTo, amount, class: className = '' }: Props = $props();
</script>

<div class={cn('r-member', className)}>
	<Avatar {name} size="sm" />
	<div>
		<div class="nm">{name}</div>
		<div class="det">owes {owesTo}</div>
	</div>
	<span class="bal">{peso(amount)}</span>
</div>
