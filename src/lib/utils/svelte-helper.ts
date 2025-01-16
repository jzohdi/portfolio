import { dev } from '$app/environment';
import type { NotionImageUseCase } from "$lib/types/types";
import { getFileNameFrom } from './vite-helper';

export function getImageSrc(useCase: NotionImageUseCase, url: string) {
	if (dev) {
		// running in dev mode
		return url;
	}
	if (!url.startsWith("https://prod-files-secure.s3"))  {
		return url;
	}
	return '/posts' + getFileNameFrom(url)
}