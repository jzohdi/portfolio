<script>
	import LightDarkToggle from './LightDarkToggle.svelte';
	import { fly } from 'svelte/transition';
	import { page } from '$app/stores';
	import GithubLogo from './icons/GithubLogo.svelte';

	let isMenuOpen = false;

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}
	const menuItems = [
		{ href: '/', label: 'About' },
		{ href: '/projects', label: 'Projects' },
		{ href: '/experiments', label: 'Experiments' },
		{ href: '/posts', label: 'Posts' }
	];
</script>

<div class="container mx-auto flex items-center justify-between p-4">
	<div class="flex items-center">
		<span class="ml-2 text-xl font-bold">Jake Zohdi</span>
		<span class="ml-3 text-lg text-secondary">Developer</span>
		<a
			href="https://github.com/jzohdi"
			target="_blank"
			aria-label="open-github"
			class="ml-2 dark:fill-white"
		>
			<GithubLogo width={24} height={24} />
		</a>
	</div>
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

{#if isMenuOpen}
	<nav
		class="fixed right-0 top-[64px] z-50 h-[calc(100vh-64px)] w-64 bg-white shadow-lg dark:bg-gray-900 md:hidden"
		transition:fly={{ x: 300, duration: 300, opacity: 1 }}
	>
		<div class="flex h-full flex-col">
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
			<div class="border-t border-gray-200 p-4 dark:border-gray-700">
				<div class="flex items-center justify-between px-2">
					<span class="text-sm text-gray-600 dark:text-gray-400">Theme</span>
					<LightDarkToggle />
				</div>
			</div>
		</div>
	</nav>
{/if}
