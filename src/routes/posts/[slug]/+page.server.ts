import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPageBlocks, getPublishedPostBySlug } from '$lib/notion/server';

export const load: PageServerLoad = async ({ params }) => {
	const posts = await getPublishedPostBySlug(params.slug);
    if (posts.length < 1) {
        error(404, "Not found")
    }
    const post = posts[0];
    const blocks = await getPageBlocks(post.id);
    return { blocks, post };
};