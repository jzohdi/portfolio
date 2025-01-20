import type { PostBlock } from '$lib/types/blocks';
import type { ExperimentsQuery } from '$lib/types/experiments';
import type { PostsQuery } from '$lib/types/posts';
import type { ProjectsQuery } from '$lib/types/projects';
import { Client } from '@notionhq/client';

const POSTS_DATABASE_ID = '16b216c9-d0ab-801d-9d5c-f899728f5d75';

export function getNotionClient(apiKey: string) {
	return new Client({ auth: apiKey });
}

export async function listPublishedPosts(notion: Client) {
	const response = (await notion.databases.query({
		database_id: POSTS_DATABASE_ID,
		sorts: [
			{
				property: 'Publish Date',
				direction: 'descending'
			}
		],
		filter: {
			property: 'Hidden',
			checkbox: {
				equals: false
			}
		}
	})) as PostsQuery;
	return response.results.filter((result) => {
		return result.properties['Publish Date'].date !== null;
	});
}

export async function listPublishedPostByName(notion: Client, name: string) {
	const response = (await notion.databases.query({
		database_id: POSTS_DATABASE_ID,
		filter: {
			and: [
				{
					property: 'Hidden',
					checkbox: {
						equals: false
					}
				},
				{
					property: 'Name',
					rich_text: {
						equals: name
					}
				},
				{
					property: 'Publish Date',
					date: {
						is_not_empty: true
					}
				}
			]
		}
	})) as PostsQuery;
	return response.results;
}

export async function listAllPostBlocks(notion: Client, pageId: string): Promise<PostBlock[]> {
	return fetchAll((cursor) => {
		return notion.blocks.children.list({
			block_id: pageId,
			start_cursor: cursor
		});
	});
}

export const PROJECT_DATABASE = '17e216c9-d0ab-8048-9440-f138797d473f';

export async function listPublishedProjects(notion: Client) {
	const response = (await notion.databases.query({
		database_id: PROJECT_DATABASE,
		filter: {
			property: 'published',
			checkbox: {
				equals: true
			}
		}
	})) as ProjectsQuery;

	return response.results.filter((result) => result.properties.published.checkbox === true);
}

const EXPERIMENTS_DATABASE = '17f216c9-d0ab-80bc-80c1-fa31426d799a';

export async function listAllExperiments(notion: Client) {
	const response = (await notion.databases.query({
		database_id: EXPERIMENTS_DATABASE
	})) as ExperimentsQuery;

	return response.results;
}

async function fetchAll<T>(
	getter: (cursor?: string) => Promise<{ next_cursor: string | null; results: unknown[] }>
) {
	const blocks: T[] = [];
	let cursor;

	do {
		const response = await getter(cursor);
		const results = response.results as T[];
		blocks.push(...results);
		cursor = response.next_cursor;
	} while (cursor);
	return blocks;
}
