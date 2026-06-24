<script lang="ts">
	import { avatarIndex, initials } from '$lib/kkb/utils';
	import { cn } from '$lib/ui/cn';

	type Size = 'sm' | 'default' | 'md' | 'lg';

	interface Props {
		name: string;
		size?: Size;
		class?: string;
	}

	let { name, size = 'default', class: className = '' }: Props = $props();

	const label = $derived(initials(name));
	const palette = $derived(`av-${avatarIndex(name)}`);
	const sizeClass = $derived(
		size === 'sm' ? 'avatar-sm' : size === 'md' ? 'avatar-md' : size === 'lg' ? 'avatar-lg' : ''
	);
</script>

<span class={cn('avatar', palette, sizeClass, className)} aria-hidden="true">{label}</span>
