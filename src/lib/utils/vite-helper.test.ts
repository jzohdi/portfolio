import { describe, expect, it } from 'vitest';
import { getFileNameFrom, isValidUrl } from './vite-helper';

// The build (scripts/save-post-images.ts) saves each Notion image to static/<useCase> plus
// this path, and the pages (getImageSrc) link /<useCase> plus the same path, so the two
// must agree and must never depend on Notion's expiring signed query string.
describe('getFileNameFrom', () => {
	const signed =
		'https://prod-files-secure.s3.us-west-2.amazonaws.com/ws-id/file-id/photo.jpeg' +
		'?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=3600&X-Amz-Signature=abc';

	it('keeps the path and drops the signed query string', () => {
		expect(getFileNameFrom(signed)).toBe('/ws-id/file-id/photo.jpeg');
	});

	it('is the same for two signatures of one file', () => {
		expect(getFileNameFrom(signed.replace('Signature=abc', 'Signature=def'))).toBe(
			getFileNameFrom(signed)
		);
	});

	it('resolves dot segments, so a path never climbs out of static/<useCase>', () => {
		expect(getFileNameFrom('https://example.com/a/../../../etc/passwd')).toBe('/etc/passwd');
	});

	it('returns null for something that is not a URL', () => {
		expect(getFileNameFrom('not a url')).toBeNull();
	});
});

describe('isValidUrl', () => {
	it('accepts http(s) URLs only', () => {
		expect(isValidUrl('https://jakezohdi.dev/posts')).toBe(true);
		expect(isValidUrl('mailto:someone@example.com')).toBe(false);
		expect(isValidUrl('http//broken')).toBe(false);
	});
});
