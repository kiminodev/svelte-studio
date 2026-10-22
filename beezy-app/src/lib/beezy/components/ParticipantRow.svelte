<script lang="ts">
	import { pesoSigned } from '$lib/beezy/format';
	import { balanceVariant } from '$lib/beezy/settlement';
	import { Avatar, Icon, cn } from '$lib/components';

	interface Props {
		name: string;
		balance: number;
		gcash?: string;
		class?: string;
		onremove?: () => void;
	}

	let {
		name,
		balance,
		gcash,
		class: className = '',
		onremove
	}: Props = $props();

	const variant = $derived(balanceVariant(balance));
	const showBalance = $derived(variant !== 'zero');
</script>

<div class={cn('pax-row', className)}>
	<Avatar {name} size="lg" />
	<div>
		<div class="nm">{name}</div>
		{#if gcash}
			<div class="sub">GCash {gcash}</div>
		{/if}
	</div>
	<div class="pax-trail">
		{#if showBalance}
			<span class={cn('bal', variant)}>{pesoSigned(balance)}</span>
		{/if}
		{#if onremove}
			<button type="button" class="pax-remove" aria-label="Remove {name}" onclick={onremove}>
				<Icon name="x" />
			</button>
		{/if}
	</div>
</div>

<style>
	.pax-trail {
		display: flex;
		align-items: center;
		gap: 6px;
	}
</style>
