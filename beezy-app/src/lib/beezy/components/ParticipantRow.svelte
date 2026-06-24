<script lang="ts">
	import { peso, pesoSigned } from '$lib/beezy/format';
	import {
		balanceStatus,
		balanceVariant
	} from '$lib/beezy/settlement';
	import { Avatar, Icon, cn } from '$lib/components';

	interface Props {
		name: string;
		paid: number;
		balance: number;
		removable?: boolean;
		class?: string;
		onremove?: () => void;
	}

	let {
		name,
		paid,
		balance,
		removable = false,
		class: className = '',
		onremove
	}: Props = $props();

	const variant = $derived(balanceVariant(balance));
	const subtitle = $derived(`paid ${peso(paid)} · ${balanceStatus(balance)}`);
</script>

<div class={cn('pax-row', className)}>
	<Avatar {name} size="lg" />
	<div>
		<div class="nm">{name}</div>
		<div class="sub">{subtitle}</div>
	</div>
	<div class="pax-trail">
		<span class={cn('bal', variant)}>{pesoSigned(balance)}</span>
		{#if removable && onremove}
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
