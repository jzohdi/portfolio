import { getPublishedPosts } from "$lib/notion/server";
import type { PostsResult } from "$lib/types/posts";
import { getPostPreview } from "$lib/utils/svelte-helper";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    // TODO: probably need to paginate in the future.
	const posts = await getPublishedPosts();
    const compressedPosts = extractRelventPageData(posts);
    return { posts: compressedPosts }
};


function extractRelventPageData(posts: PostsResult[]) {
    return posts.map(getPostPreview)
}



