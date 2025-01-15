import type { PostBlock } from '$lib/types/blocks';
import type { PostsQuery } from '$lib/types/posts';
import { Client } from '@notionhq/client';

const POSTS_DATABASE_ID = "16b216c9-d0ab-801d-9d5c-f899728f5d75";

export function getNotionClient(apiKey: string) {
    return new Client({ auth: apiKey });
}

export async function listPublishedPosts(notion: Client) {
    const response = await notion.databases.query({
		database_id: POSTS_DATABASE_ID,
		sorts: [
			{
				property: "Publish Date",
				direction: "descending"
			}
		],
		filter: {
			property: "Hidden",
			checkbox: {
				equals: false
			}
		}

	}) as PostsQuery
    return response.results.filter((result) => {
		return result.properties['Publish Date'].date !== null
	});
}

export async function listPublishedPostByName(notion: Client, name: string) {
	const response = await notion.databases.query({
		database_id: POSTS_DATABASE_ID,
		filter: {
			and: [
				{
					property: "Hidden",
					checkbox: {
						equals: false
					}
				},
				{
					property: "Name",
					rich_text: {
						equals: name
					}
				},
				{
					property: "Publish Date",
					date: {
						is_not_empty: true
					}
				}
			]
		}

	}) as PostsQuery
    return response.results;
}

export async function listAllPostBlocks(notion:Client, pageId: string): Promise<PostBlock[]> {
	const blocks: PostBlock[] = [];
	let cursor;
  
	do {
	  const response = await notion.blocks.children.list({
		block_id: pageId,
		start_cursor: cursor,
	  });
	  const results = response.results as PostBlock[];
	  blocks.push(...results);
	  cursor = response.next_cursor;
	} while (cursor);
	return blocks;
}