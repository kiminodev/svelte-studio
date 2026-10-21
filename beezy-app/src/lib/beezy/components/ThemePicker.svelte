<script lang="ts">
	import { THEMES, type ThemeId } from '$lib/beezy/theme';

	interface Props {
		value?: ThemeId;
		onchange?: (id: ThemeId) => void;
	}

	let { value = 'yellow', onchange }: Props = $props();
</script>

<div class="theme-picker">
	<p class="theme-picker-label" id="theme-picker-label">App color</p>
	<div class="theme-swatches" role="radiogroup" aria-labelledby="theme-picker-label">
		{#each THEMES as option (option.id)}
			<button
				type="button"
				role="radio"
				class="theme-swatch"
				style="background: {option.swatch}"
				aria-label={option.label}
				aria-checked={value === option.id}
				onclick={() => onchange?.(option.id)}
			></button>
		{/each}
	</div>
</div>
