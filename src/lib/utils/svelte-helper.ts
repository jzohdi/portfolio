import { dev } from '$app/environment';
import type { PostsResult } from '$lib/types/posts';
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
	return `/${useCase}` + getFileNameFrom(url)
}

export type PostPreview = ReturnType<typeof getPostPreview>;

export function getPostPreview(post: PostsResult) {
    const title = post.properties.Name.title[0].plain_text;
    const description = post.properties["SEO Description"].rich_text[0].plain_text;
    const thumbnail = post.properties.thumbnail.files[0].file.url;
    const slug = post.properties.slug.rich_text[0].plain_text;
    const date = post.properties["Publish Date"].date?.start
    const tags = post.properties.Tags.multi_select.map((ele) => ele.name).join(",");
    return {
        title,
        description,
        thumbnail,
        slug,
        publishedDate: date,
        tags
    }
}