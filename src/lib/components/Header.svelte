<script>
	import LightDarkToggle from './LightDarkToggle.svelte';
	import { fly } from 'svelte/transition';
	import { page } from '$app/stores';

	let isMenuOpen = false;

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}
	const menuItems = [
		{ href: '/', label: 'About' }
		// { href: '/projects', label: 'Projects' },
		// { href: '/experiments', label: 'Experiments' },
		// {href: "/blog", label: "Blog"}
	];
</script>

<div class="container mx-auto flex items-center justify-between p-4">
	<!-- Logo -->
	<div class="flex items-center">
		<span class="ml-2 text-xl font-bold">Jake Zohdi</span>
		<span class="ml-3 text-lg text-secondary">Developer</span>
		<a
			href="https://github.com/jzohdi"
			target="_blank"
			aria-label="open-github"
			class="ml-2 dark:fill-white"
			><svg
				width="98"
				height="96"
				viewBox="0 0 98 96"
				style="width:20px; height: 20px;"
				xmlns="http://www.w3.org/2000/svg"
				><path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
				/></svg
			></a
		>
	</div>
	<!-- Navigation Links -->
	<nav class="hidden items-center space-x-6 md:flex">
		{#each menuItems as { href, label }}
			<a
				{href}
				class:text-secondary={$page.url.pathname === href}
				class="text-primary hover:text-secondary">{label}</a
			>
		{/each}
		<LightDarkToggle />
	</nav>
	<!-- Mobile Menu Button -->
	<button
		class="text-gray-600 hover:text-secondary focus:outline-none md:hidden"
		aria-label="Toggle menu"
		on:click={toggleMenu}
	>
		<svg
			class="h-6 w-6"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 6h16M4 12h16M4 18h16"
			></path>
		</svg>
	</button>
</div>
<!-- Mobile Navigation Menu -->
{#if isMenuOpen}
	<nav
		class="fixed right-0 top-[64px] z-50 h-[calc(100vh-64px)] w-64 bg-white shadow-lg dark:bg-gray-900 md:hidden"
		transition:fly={{ x: 300, duration: 300, opacity: 1 }}
	>
		<div class="flex h-full flex-col">
			<!-- Navigation Links -->
			<div class="flex-1 py-4">
				{#each menuItems as { href, label }}
					<a
						{href}
						on:click={() => (isMenuOpen = false)}
						class="block px-6 py-3 text-primary transition-colors hover:text-secondary"
						class:text-secondary={$page.url.pathname === href}
					>
						{label}
					</a>
				{/each}
			</div>

			<!-- Bottom Section with Theme Toggle -->
			<div class="border-t border-gray-200 p-4 dark:border-gray-700">
				<div class="flex items-center justify-between px-2">
					<span class="text-sm text-gray-600 dark:text-gray-400">Theme</span>
					<LightDarkToggle />
				</div>
			</div>
		</div>
	</nav>
{/if}
