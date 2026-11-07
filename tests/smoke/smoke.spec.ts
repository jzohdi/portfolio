import {
	test,
	expect,
	isLocal,
	get,
	settle,
	images,
	canvasNonBlank,
	reseed,
	NO_SUCH
} from './fixtures';

// Behavior smoke test B1–B15; B16 (no page errors, no own 4xx/5xx) runs after every test
// (fixtures.ts). It checks structure, not Notion's wording, so content edits don't break it.

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
const text = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

test.describe('home', () => {
	test('B1: the Notion sections, the picture and the resume list render', async ({ page }) => {
		const res = await page.goto('/');
		expect(res?.status()).toBe(200);
		await settle(page);
		const main = page.locator('main');
		await expect(main.locator('h2').first()).not.toBeEmpty();
		await expect(main.locator('h3').first()).not.toBeEmpty();
		const paragraphs = (await main.locator('p').allInnerTexts()).map(text).filter(Boolean);
		expect(paragraphs.length).toBeGreaterThanOrEqual(3);
		await expect(main.locator('a[href^="/posts/"][aria-label]')).toHaveCount(2);
		expect(await main.locator('button[aria-label="show details"]').count()).toBeGreaterThanOrEqual(
			2
		);

		const me = await page
			.locator('img[alt="picture of me"]')
			.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0);
		expect(me, 'the <enhanced:img> picture loads').toBe(true);
		const notLoaded = (await images(page)).filter((i) => !i.ok);
		expect(notLoaded, 'every image in main loads').toEqual([]);

		// The resume list sits in a closed Collapsible.
		const rows = main.locator('ul li.text-xs');
		await expect(rows).toHaveCount(0);
		await main
			.locator('button')
			.filter({ has: page.locator('h3') })
			.first()
			.click();
		await expect(rows.first()).toBeVisible();
		const rowTexts = (await rows.allInnerTexts()).map(text);
		expect(rowTexts.length).toBeGreaterThan(0);
		expect(rowTexts.every(Boolean)).toBe(true);
	});

	test('B1: a gallery item’s Show Details opens and closes', async ({ page }) => {
		await page.goto('/');
		await settle(page, { scroll: false });
		const item = page.locator('main div.group:has(button[aria-label="show details"])').first();
		const panel = item.locator('div.absolute.left-0.h-full');
		await item.locator('button[aria-label="show details"]').click({ force: true });
		await expect(panel).toHaveClass(/\btop-0\b/);
		expect(await panel.locator('a').count()).toBeGreaterThanOrEqual(1);
		await panel.locator('button', { hasText: 'Close' }).click({ force: true });
		await expect(panel).toHaveClass(/\btop-80\b/);
	});

	test('B2: the light/dark toggle flips html.dark, swaps the icon and survives a reload', async ({
		page
	}) => {
		await page.goto('/');
		await settle(page, { scroll: false });
		const html = page.locator('html');
		const toggle = () => page.locator('nav:visible button', { hasText: 'Toggle theme' }).first();
		const sunTransform = () =>
			toggle()
				.locator('svg')
				.first()
				.evaluate((s) => getComputedStyle(s).transform);
		await expect(html).not.toHaveClass(/\bdark\b/);
		const sunLight = await sunTransform();
		await toggle().click();
		await expect(html).toHaveClass(/\bdark\b/);
		await pause(600); // the icon's CSS transition
		expect(await sunTransform(), 'the sun icon scales away in dark mode').not.toBe(sunLight);
		await page.reload();
		await expect(html).toHaveClass(/\bdark\b/);
		await toggle().click();
		await expect(html).not.toHaveClass(/\bdark\b/);
	});

	test('B3: the 3D resume draws a canvas, and drag and keys don’t throw', async ({ page }) => {
		await page.goto('/');
		await settle(page, { scroll: false });
		const trigger = page.locator('button', { hasText: 'Render Resume' });
		await trigger.scrollIntoViewIfNeeded();
		await trigger.click();
		const canvas = page.locator('.game-bleed .game-canvas canvas');
		await expect(canvas).toBeVisible({ timeout: 20000 });
		await pause(2500);
		expect(await canvasNonBlank(page, canvas)).toBe(true);
		await expect(page.locator('.game-bleed .resume-card .card-progress')).toHaveText(
			/^\s*1 \/ \d+\s*$/
		);
		const box = (await canvas.boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 40, { steps: 8 });
		await page.mouse.up();
		await page.keyboard.down('ArrowLeft');
		await pause(300);
		await page.keyboard.up('ArrowLeft');
		await page.keyboard.press('Space');
		await pause(500);
		expect(await canvasNonBlank(page, canvas)).toBe(true);
	});
});

test.describe('mobile', () => {
	test.use({
		viewport: { width: 390, height: 844 },
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true
	});

	test('B1: the mobile home page renders and its menu opens', async ({ page }) => {
		expect((await page.goto('/'))?.status()).toBe(200);
		const menu = page.locator('button[aria-label="Toggle menu"]');
		await expect(menu).toBeVisible();
		await menu.click();
		await expect(page.locator('nav.fixed a')).toHaveCount(4);
	});
});

test('B4 and B5: /posts lists the posts, and each post renders its blocks', async ({
	page,
	request
}) => {
	test.setTimeout(180_000);
	expect((await page.goto('/posts'))?.status()).toBe(200);
	await settle(page, { scroll: false });
	const links = page.locator('main ul > li a[href^="/posts/"]');
	const posts = await links.evaluateAll((as) =>
		as.map((a) => ({
			href: a.getAttribute('href')!,
			title: a.querySelector('h2')?.textContent?.trim(),
			desc: a.querySelector('p')?.textContent?.trim()
		}))
	);
	expect(posts.length, 'B4: at least one published post').toBeGreaterThanOrEqual(1);
	for (const p of posts) {
		expect(p.title, `B4: ${p.href} has a title`).toBeTruthy();
		expect(p.desc, `B4: ${p.href} has a description`).toBeTruthy();
	}

	let withCode = 0;
	let withLists = 0;
	for (const { href } of posts) {
		expect((await page.goto(href))?.status(), href).toBe(200);
		await settle(page);
		const main = page.locator('main');
		await expect(main.locator('h1').first()).not.toBeEmpty();
		const pre = await main.locator('pre').count();
		if (pre > 0) {
			await expect(main.locator('pre [class*="hljs-"]').first()).toBeAttached({ timeout: 8000 });
			withCode++;
		}
		if ((await main.locator('ol > li, ul.list-disc > li').count()) > 0) withLists++;
		const imgs = await images(page);
		expect(imgs.length, `${href} has images`).toBeGreaterThanOrEqual(1);
		for (const i of imgs) {
			expect(i.path, `${href}: images are served from /posts/`).toMatch(/^\/posts\//);
			expect(i.ok, `${href}: ${i.path} loads`).toBe(true);
		}
	}
	expect(withCode, 'B5: some post has highlighted code').toBeGreaterThanOrEqual(1);
	expect(withLists, 'B5: some post has list items').toBeGreaterThanOrEqual(1);

	expect((await get(request, `/posts/${NO_SUCH}`)).status()).toBe(404);
	expect((await page.goto(`/posts/${NO_SUCH}`))?.status()).toBe(404);
});

test('B6: /projects lists projects with thumbnails and links', async ({ page }) => {
	expect((await page.goto('/projects'))?.status()).toBe(200);
	await settle(page);
	const items = await page.locator('main ul > li').evaluateAll((lis) =>
		lis.map((li) => {
			const img = li.querySelector('img');
			return {
				title: li.querySelector('h2')?.textContent?.trim(),
				desc: li.querySelector('p')?.textContent?.trim(),
				path: img ? new URL(img.currentSrc || img.src, location.href).pathname : '',
				ok: !!img && img.complete && img.naturalWidth > 0,
				open: [...li.querySelectorAll('a')].some(
					(a) => a.textContent?.trim() === 'Open' && a.target === '_blank'
				)
			};
		})
	);
	expect(items.length).toBeGreaterThanOrEqual(1);
	for (const i of items) {
		expect(i.title).toBeTruthy();
		expect(i.desc, `${i.title} has a description`).toBeTruthy();
		expect(i.path, `${i.title}'s thumbnail is local`).toMatch(/^\/projects\//);
		expect(i.ok, `${i.title}'s thumbnail loads`).toBe(true);
		expect(i.open, `${i.title} has an Open link in a new tab`).toBe(true);
	}
});

test('B7: /experiments shows the gallery and sidebar, and every experiment resolves', async ({
	page,
	request
}) => {
	expect((await page.goto('/experiments'))?.status()).toBe(200);
	await settle(page);
	const d = await page.evaluate(() => {
		const m = document.querySelector('main')!;
		const sidebar = [...m.querySelectorAll('div.fixed a, div.relative > div > div a')]
			.filter((a) => !a.textContent?.includes('Go'))
			.map((a) => a.getAttribute('href'));
		const gallery = [...m.querySelectorAll('ul > li')].map((li) =>
			li.querySelector('a[href^="/experiments/"]')?.getAttribute('href')
		);
		return { sidebar, gallery };
	});
	expect(d.gallery.length).toBeGreaterThanOrEqual(1);
	expect(d.sidebar.length, 'the sidebar lists every gallery item').toBe(d.gallery.length);
	expect((await images(page)).filter((i) => !i.ok)).toEqual([]);
	const hrefs = new Set(
		[...d.sidebar, ...d.gallery, '/experiments/resume', '/experiments/video-game-resume'].filter(
			(h): h is string => !!h
		)
	);
	for (const h of hrefs) expect((await get(request, h)).status(), h).toBe(200);

	await page.goto('/experiments/graphing-calculator');
	await settle(page, { scroll: false });
	await page.locator('main button', { hasText: 'Run' }).click();
	await expect(page).toHaveURL(/\?runExperiment=true$/);
	await expect(page.locator('div.fixed.inset-0')).toBeVisible();
	await page.locator('div.fixed.inset-0 button', { hasText: 'Close' }).click();
	await expect(page).toHaveURL(/\?runExperiment=false$/);
});

test('B8: the graphing calculator draws x^2 and shows its derivative and y', async ({ page }) => {
	await page.goto('/experiments/graphing-calculator?runExperiment=true');
	await settle(page, { scroll: false });
	const canvas = page.locator('form canvas');
	await expect(canvas).toBeVisible();
	const submit = async (formula: string, x: number) => {
		await page.fill('#function', formula);
		await page.fill('#x-coordinate', String(x));
		await page.locator('form button[type=submit]').click();
		await pause(500);
		await page.mouse.move(0, 0);
	};
	const derivative = page.locator('form dd');
	const y = page.locator('#y-coordinate');

	await submit('x^2', 2);
	await expect(derivative).toHaveText('2 * x');
	await expect(y).toHaveValue('4');
	expect(await canvasNonBlank(page, canvas)).toBe(true);

	await page.fill('#x-coordinate', '3');
	await page.locator('#x-coordinate').dispatchEvent('change');
	await expect(y).toHaveValue('9');

	await submit('sin(x)', 1);
	await expect(derivative).toHaveText('cos(x)');
	await expect(y).toHaveValue('0.8414709848078965');
	expect(await canvasNonBlank(page, canvas)).toBe(true);

	// Typed text never reaches the DOM as HTML: mathjs rejects it and nothing is added.
	const sinks = () => page.evaluate(() => document.querySelectorAll('img,script,iframe').length);
	const before = await sinks();
	await submit('<img src=x onerror=alert(1)>', 1);
	expect(await sinks()).toBe(before);
	await expect(derivative).toHaveText('cos(x)');
});

test('B9: wasm-sudoku loads, and Hint, Solve, Reset and reload work', async ({ page }) => {
	const modal = page.locator('div.fixed.inset-0');
	const button = (name: string) => modal.locator('button', { hasText: name });
	const ready = () => expect(button('Solve')).toBeEnabled({ timeout: 30000 });
	const board = () =>
		modal
			.locator('.grid-cols-9 input')
			.evaluateAll((is) => is.map((i) => (i as HTMLInputElement).value || '0').join(''));
	const filled = (s: string) => [...s].filter((c) => c !== '0').length;
	const valid = (s: string) => {
		if (!/^[1-9]{81}$/.test(s)) return false;
		const nine = (cells: string[]) => new Set(cells).size === 9;
		for (let i = 0; i < 9; i++) {
			const r = Math.floor(i / 3) * 3;
			const c = (i % 3) * 3;
			if (!nine([...Array(9)].map((_, j) => s[i * 9 + j]))) return false;
			if (!nine([...Array(9)].map((_, j) => s[j * 9 + i]))) return false;
			if (!nine([...Array(9)].map((_, j) => s[(r + Math.floor(j / 3)) * 9 + c + (j % 3)])))
				return false;
		}
		return true;
	};

	await page.goto('/experiments/wasm-sudoku?runExperiment=true');
	await ready();
	await expect(button('Hint')).toBeEnabled();
	await expect(button('Reset')).toBeEnabled();
	const start = await board();
	expect(filled(start)).toBe(17);

	await reseed(page, 0x41417);
	await button('Hint').click();
	await pause(300);
	expect(filled(await board())).toBe(18);
	await expect(modal.locator('.grid-cols-9 input.bg-blue-100')).toHaveCount(1);

	await button('Solve').click();
	await pause(400);
	const solved = await board();
	expect(valid(solved), 'Solve fills a valid sudoku').toBe(true);
	expect(
		[...start].every((c, i) => c === '0' || c === solved[i]),
		'consistent with the givens'
	).toBe(true);
	await expect(button('Hint')).toBeDisabled();

	await page.reload();
	await ready();
	await pause(300);
	expect(await board(), 'the board survives a reload').toBe(solved);

	await reseed(page, 0x7e5e7);
	await button('Reset').click();
	await pause(800);
	const fresh = await board();
	expect(filled(fresh)).toBe(17);
	expect(fresh).not.toBe(start);

	// A malformed stored board is ignored and nothing is injected.
	await page.evaluate(() =>
		localStorage.setItem('SUDOKU_BOARD_LOCAL_STORAGE', '<img src=x onerror=alert(1)>')
	);
	await page.reload();
	await ready();
	await pause(300);
	expect(filled(await board())).toBe(17);
	await expect(page.locator("img[src='x']")).toHaveCount(0);
});

test('B10: ai-2048 moves tiles, the AI plays, the depth slider and Tim mode work', async ({
	page
}) => {
	await page.goto('/experiments/ai-2048?runExperiment=true');
	await expect(page.locator('.tile-container .tile').first()).toBeAttached({ timeout: 20000 });
	await settle(page, { scroll: false });
	const tiles = () =>
		page.evaluate(() =>
			[...document.querySelectorAll('.tile-container .tile')]
				.map((t) => [...t.classList].filter((c) => /^tile-(\d+|position-\d-\d)$/.test(c)).join(' '))
				.sort()
				.join(',')
		);
	const start = await tiles();
	expect(start.split(',')).toHaveLength(2);

	await reseed(page, 0x2048);
	let moved = false;
	let prev = start;
	for (const k of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
		await page.keyboard.press(k);
		await pause(250);
		const now = await tiles();
		if (now !== prev) moved = true;
		prev = now;
	}
	expect(moved, 'arrow keys move the tiles').toBe(true);
	await expect(page.locator('.score-container')).toHaveText(/\d/);

	const depth = () =>
		page.evaluate(() =>
			[...document.querySelectorAll('label')]
				.find((l) => l.textContent?.includes('AI Depth'))
				?.parentElement?.textContent?.replace(/\s+/g, ' ')
				.trim()
		);
	const nodes = () =>
		page.evaluate(
			() =>
				[...document.querySelectorAll('strong')].find((s) => s.textContent?.includes('nodes:'))
					?.nextElementSibling?.textContent
		);
	const d0 = await depth();
	const n0 = await nodes();
	await page.locator('[role="slider"]').first().focus();
	for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowLeft');
	await pause(300);
	expect(await depth(), 'the depth slider changes the depth').not.toBe(d0);
	expect(await nodes(), 'and the node count').not.toBe(n0);

	const beforeAi = await tiles();
	await page.locator('#run-ai-switch').click();
	await pause(1500);
	await page.locator('#run-ai-switch').click({ timeout: 15000 });
	await pause(300);
	expect(await tiles(), 'the AI plays moves by itself').not.toBe(beforeAi);
	await expect(page.locator('#run-ai-switch')).toHaveAttribute('data-state', 'unchecked');

	await page.locator('#tim-robinson-mode-toggle').click();
	await expect(page).toHaveURL(/tim=true/);
	await expect(page.locator('.tile-container')).toHaveClass(/\btim-mode\b/);
	await page.locator('#tim-robinson-mode-toggle').click();
	await expect(page).not.toHaveURL(/tim=true/);
});

test('B11: Conway’s HTML grid evolves and stops; the WebGPU page renders', async ({
	page,
	allowPageErrors
}) => {
	await page.goto('/experiments/conways-2d-html?runExperiment=true');
	await expect(page.locator('.conways-game-row').first()).toBeAttached({ timeout: 20000 });
	await pause(300);
	const alive = () =>
		page.evaluate(() => [...document.querySelectorAll('.cell-on')].map((c) => c.id).join(','));
	expect(await page.locator('.conways-game-row > div').count()).toBeGreaterThan(100);
	const a0 = await alive();
	expect(a0).not.toBe('');
	await pause(1500);
	expect(await alive(), 'the grid evolves').not.toBe(a0);
	await page.locator('#stop-button').click();
	await pause(300);
	const stopped = await alive();
	await pause(800);
	expect(await alive(), 'Stop freezes it').toBe(stopped);

	await page.goto('/experiments/conways-2d-webgpu?runExperiment=true');
	const hasGpu = await page.evaluate(() => 'gpu' in navigator);
	// Without WebGPU the page can only report an error; the baseline browser has it.
	allowPageErrors.value = !hasGpu;
	await pause(2500);
	if (hasGpu) await expect(page.locator('div.fixed.inset-0 canvas')).toHaveCount(1);
});

test('B12: /experiments/resume draws WebGL; video-game-resume starts and takes keys', async ({
	page
}) => {
	expect((await page.goto('/experiments/resume'))?.status()).toBe(200);
	await page.waitForLoadState('networkidle').catch(() => {});
	await pause(3000);
	const canvas = page.locator('canvas').filter({ visible: true }).first();
	expect(await canvasNonBlank(page, canvas)).toBe(true);
	const frames = await page.evaluate(() =>
		[...document.querySelectorAll('iframe')].map((f) => {
			try {
				return !!f.contentDocument;
			} catch {
				return false;
			}
		})
	);
	expect(frames.length, 'the offscreen iframe exists').toBeGreaterThanOrEqual(1);
	expect(frames.every(Boolean), 'and is same-origin').toBe(true);
	const box = (await canvas.boundingBox())!;
	const y = box.y + Math.min(200, box.height / 2);
	await page.mouse.move(box.x + box.width / 2, y);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width / 2 + 80, y + 60, { steps: 6 });
	await page.mouse.up();
	await pause(400);
	expect(await canvasNonBlank(page, canvas)).toBe(true);

	expect((await page.goto('/experiments/video-game-resume'))?.status()).toBe(200);
	const game = page.locator('.game-canvas canvas');
	await expect(game).toBeVisible({ timeout: 20000 });
	await pause(2500);
	expect(await canvasNonBlank(page, game)).toBe(true);
	await expect(page.locator('.resume-card .card-progress')).toHaveText(/^\s*1 \/ \d+\s*$/);
	// The game's keyboard source calls preventDefault on the keys it handles.
	await page.evaluate(() => {
		const w = window as unknown as { __keys: string[] };
		w.__keys = [];
		window.addEventListener('keydown', (e) => w.__keys.push(`${e.key}:${e.defaultPrevented}`));
	});
	for (const k of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'a', 'Space']) {
		await page.keyboard.down(k);
		await pause(250);
		await page.keyboard.up(k);
	}
	const keys = await page.evaluate(() => (window as unknown as { __keys: string[] }).__keys);
	expect(keys.length).toBeGreaterThan(0);
	expect(
		keys.filter((k) => !k.endsWith(':true')),
		'every key is handled by the game'
	).toEqual([]);
	await pause(500);
	expect(await canvasNonBlank(page, game)).toBe(true);
});

test('B13–B15: resume.html, the 404 page and the analytics script', async ({ page, request }) => {
	const resume = await get(request, '/files/resume.html');
	expect(resume.status(), 'B13').toBe(200);
	expect(resume.headers()['content-type']).toMatch(/^text\/html/);

	expect((await get(request, `/${NO_SUCH}-page`)).status(), 'B14').toBe(404);
	expect((await page.goto(`/${NO_SUCH}-page`))?.status(), 'B14').toBe(404);
	await expect(page.locator('body')).toContainText('404');

	const insights = await get(request, '/_vercel/insights/script.js');
	expect(insights.status(), 'B15: 200 on Vercel, 404 off it').toBe(isLocal ? 404 : 200);
});

// vercel.json sets these, so only a Vercel deployment sends them (vite preview doesn't).
test('the security header baseline is on pages, assets and the 404', async ({ request }) => {
	test.skip(isLocal, 'vercel.json headers apply on Vercel only');
	for (const path of [
		'/',
		'/posts',
		'/__data.json',
		'/files/resume.html',
		'/sudoku/sudoku_wasi.wasm',
		'/_app/version.json',
		`/${NO_SUCH}-page`
	]) {
		const h = (await get(request, path)).headers();
		expect(h['x-content-type-options'], path).toBe('nosniff');
		expect(h['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
		expect(h['permissions-policy'], path).toBe('camera=(), microphone=(), geolocation=()');
		expect(h['content-security-policy'], path).toBe(
			"frame-ancestors 'self' https://jakezohdi.dev https://studio-zohdi-llc.com https://www.studio-zohdi-llc.com"
		);
		expect(h['x-powered-by'], path).toBeUndefined();
	}
});
