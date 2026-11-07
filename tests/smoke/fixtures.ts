import {
	test as base,
	expect,
	type APIRequestContext,
	type Locator,
	type Page
} from '@playwright/test';

/**
 * Shared fixtures for the behavior smoke test (B1–B16).
 *
 * It never starts a server. BASE_URL points at a running build or a deployment:
 *   npm run build && npm run preview -- --port 4173    (a local build needs the Notion env)
 *   BASE_URL=http://localhost:4173 npm run test:smoke
 *   BASE_URL=https://jakezohdi.dev npm run test:smoke
 *
 * Safety: it only reads. Every non-GET request is answered inside the browser (204), so
 * nothing (an analytics beacon included) leaves it. Requests to other origins are aborted,
 * apart from the Google Fonts GETs that /files/resume.html makes.
 *
 * Protected Vercel previews: set VERCEL_OIDC_TOKEN. It's added as
 * x-vercel-trusted-oidc-idp-token to requests for BASE_URL's own origin only, and only
 * when that host ends in .vercel.app. It's never logged.
 */

const baseURL = (process.env.BASE_URL ?? 'http://localhost:4173').replace(/\/$/, '');
const baseOrigin = new URL(baseURL).origin;
const host = new URL(baseURL).hostname;
export const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(host);

const oidc: Record<string, string> =
	process.env.VERCEL_OIDC_TOKEN && host.endsWith('.vercel.app')
		? { 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN }
		: {};

const FONT_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);
// Some TLS-intercepting VPNs inject a script at a long random same-origin path; never the site's.
const INJECTED = /^\/[A-Za-z0-9_-]{40,}$/;
// Paths that the tests request on purpose to get a 404.
export const NO_SUCH = 'smoke-no-such';

const isOwnOrigin = (url: string) => URL.canParse(url) && new URL(url).origin === baseOrigin;
const pathOf = (url: string) => (URL.canParse(url) ? new URL(url).pathname : url);
// Off Vercel the analytics script 404s; that's the only 4xx allowed locally.
const allowedLocally = (url: string) => isLocal && pathOf(url) === '/_vercel/insights/script.js';

/** GET a path of the site with no redirects followed (adds the preview header when set). */
export function get(request: APIRequestContext, path: string) {
	return request.get(baseURL + path, { maxRedirects: 0, failOnStatusCode: false, headers: oidc });
}

/** Seed Math.random (mulberry32). window.__smokeSeed(n) reseeds it from a test. */
function seedRandom() {
	let s = 0x5eed1234;
	Math.random = () => {
		s |= 0;
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	(window as unknown as { __smokeSeed: (n: number) => void }).__smokeSeed = (n) => {
		s = n | 0;
	};
	// Reseed once a WASM module is instantiated. The sudoku builds its board right after, and
	// some random boards take its solver far longer than the test waits; this one is quick.
	const instantiate = WebAssembly.instantiate.bind(WebAssembly) as (
		...args: unknown[]
	) => Promise<unknown>;
	(WebAssembly as unknown as { instantiate: unknown }).instantiate = (...args: unknown[]) =>
		instantiate(...args).then((result) => {
			s = 0x50d0c0;
			return result;
		});
}

export const reseed = (page: Page, n: number) =>
	page.evaluate(
		(n) => (window as unknown as { __smokeSeed: (n: number) => void }).__smokeSeed(n),
		n
	);

type Fixtures = {
	/** Page errors and own-origin 4xx/5xx responses (B16), checked after every test. */
	siteErrors: string[];
	/** Set by a test that tolerates page errors (only WebGPU without a GPU). */
	allowPageErrors: { value: boolean };
};

export const test = base.extend<Fixtures>({
	// Playwright needs the destructuring pattern, even when empty.
	// eslint-disable-next-line no-empty-pattern
	allowPageErrors: async ({}, use) => {
		await use({ value: false });
	},
	context: async ({ context }, use) => {
		await context.addInitScript(seedRandom);
		await context.route('**/*', async (route) => {
			const req = route.request();
			const url = new URL(req.url());
			if (url.protocol === 'data:' || url.protocol === 'blob:') return route.continue();
			const method = req.method();
			if (method !== 'GET' && method !== 'HEAD') return route.fulfill({ status: 204, body: '' });
			if (url.origin !== baseOrigin) {
				return FONT_HOSTS.has(url.hostname) ? route.continue() : route.abort('blockedbyclient');
			}
			if (INJECTED.test(url.pathname)) return route.abort('blockedbyclient');
			return route.continue({ headers: { ...req.headers(), ...oidc } });
		});
		await use(context);
	},
	siteErrors: [
		async ({ context, allowPageErrors }, use) => {
			const errors: string[] = [];
			const watch = (page: Page) => {
				page.on('pageerror', (error) => {
					if (!allowPageErrors.value) errors.push(`page error: ${error.message}`);
				});
				page.on('response', (response) => {
					const url = response.url();
					const method = response.request().method();
					if (method !== 'GET' && method !== 'HEAD') return;
					if (response.status() < 400 || !isOwnOrigin(url)) return;
					if (url.includes(NO_SUCH) || allowedLocally(url)) return;
					errors.push(`${response.status()} ${pathOf(url)}`);
				});
			};
			context.pages().forEach(watch);
			context.on('page', watch);
			await use(errors);
			expect(errors, 'B16: no page errors and no own-origin 4xx/5xx').toEqual([]);
		},
		{ auto: true }
	]
});

export { expect };

/** Scroll through the page (LazyImage loads on intersection), then wait for every image. */
export async function settle(page: Page, { scroll = true } = {}) {
	await page.waitForLoadState('networkidle').catch(() => {});
	if (scroll) {
		await page.evaluate(async () => {
			const step = Math.max(200, Math.floor(window.innerHeight * 0.6));
			for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
				window.scrollTo(0, y);
				await new Promise((r) => setTimeout(r, 120));
			}
			window.scrollTo(0, 0);
		});
	}
	await page.evaluate(async () => {
		await Promise.all(
			[...document.images].map((i) =>
				i.complete
					? null
					: new Promise((r) => {
							i.addEventListener('load', r, { once: true });
							i.addEventListener('error', r, { once: true });
							setTimeout(r, 10000);
						})
			)
		);
		await document.fonts.ready;
	});
	await page.waitForLoadState('networkidle').catch(() => {});
}

export type Img = { alt: string; path: string; ok: boolean };

/** Every <img> under `scope`: its resolved path and whether it loaded. */
export const images = (page: Page, scope = 'main') =>
	page.evaluate(
		(scope) =>
			[...document.querySelectorAll<HTMLImageElement>(`${scope} img`)].map((i) => ({
				alt: i.alt,
				path: new URL(i.currentSrc || i.src, location.href).pathname,
				ok: i.complete && i.naturalWidth > 0
			})),
		scope
	);

/**
 * Whether a canvas shows a picture: at least 2 colours and more than 0.5 % of its pixels
 * differ from the most common colour. Reads an element screenshot (WebGL canvases can't
 * be read back), decoded by the page itself.
 */
export async function canvasNonBlank(page: Page, canvas: Locator) {
	const png = (await canvas.screenshot({ animations: 'allow', timeout: 15000 })).toString('base64');
	return page.evaluate(async (b64) => {
		const img = new Image();
		img.src = `data:image/png;base64,${b64}`;
		await img.decode();
		const c = document.createElement('canvas');
		c.width = img.naturalWidth;
		c.height = img.naturalHeight;
		const ctx = c.getContext('2d')!;
		ctx.drawImage(img, 0, 0);
		const data = ctx.getImageData(0, 0, c.width, c.height).data;
		const counts = new Map<number, number>();
		for (let i = 0; i < data.length; i += 4) {
			const k = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
			counts.set(k, (counts.get(k) ?? 0) + 1);
		}
		const top = Math.max(...counts.values());
		return counts.size >= 2 && 1 - top / (c.width * c.height) > 0.005;
	}, png);
}
