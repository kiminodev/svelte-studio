<script lang="ts">
	import { AppBar, AppShell, Eyebrow, IconButton, ScreenHead } from '$lib/ui';
</script>

<AppShell>
	<AppBar title="Welcome to Beezy" subtitle="Split trips, stay friends">
		{#snippet brand()}🤗{/snippet}
		{#snippet trailing()}
			<IconButton aria-label="More">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none" />
					<circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
					<circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
				</svg>
			</IconButton>
		{/snippet}
	</AppBar>

	<main class="content">
		<div class="screen">
			<Eyebrow accent>Phase 2 — App shell</Eyebrow>
			<ScreenHead
				title="AppBar"
				description="Header with brand badge, title/subtitle, and trailing actions. Next: Screen."
			/>
		</div>
	</main>
</AppShell>
