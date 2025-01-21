<script>
	const { href, class: classnames, children } = $props();
</script>

<a
	class={(classnames ?? '') +
		'cursor-pointer text-blue-500 visited:text-purple-600 hover:text-blue-700 hover:underline active:text-blue-800'}
	{href}
	target={href.startsWith('http') ? '_blank' : ''}
	style="word-break: break-word;"
>
	{@render children()}
</a>
