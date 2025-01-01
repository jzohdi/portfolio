import type { NotionData, NotionResult } from '$lib/types';
import { Client } from '@notionhq/client';
import type { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';
import { NOTION_API_KEY, NOTION_DATABASE_ID } from '$env/static/private';

const notion = new Client({ auth: NOTION_API_KEY });

function parseNotionResponse(response: QueryDatabaseResponse): NotionData {
	const results = response.results as NotionResult[];
	const aboutme1Content = results.filter((r) => r.properties.group.select?.name === 'aboutme1');
	const aboutme2Content = results.filter((r) => r.properties.group.select?.name === 'aboutme2');
	const resumeContent = results.filter((r) => r.properties.group.select?.name === 'resume');
	const collector: NotionData = {
		aboutme1: {
			title: getContentByType(aboutme1Content, 'title')[0],
			p: getContentByType(aboutme1Content, 'p')
		},
		aboutme2: {
			title: getContentByType(aboutme2Content, 'title')[0],
			p: getContentByType(aboutme2Content, 'p')
		},
		resume: {
			title: getContentByType(resumeContent, 'title')[0],
			p: getContentByType(resumeContent, 'p'),
			title2: getContentByType(resumeContent, 'title2')[0],
			li: getContentByType(resumeContent, 'li')
		}
	};

	return collector;
}

function getContentByType(results: NotionResult[], type: 'p' | 'title' | 'title2' | 'li') {
	return results
		.filter((c) => c.properties?.Name.title[0].text.content === type)
		.sort((a, b) => {
			return (a.properties.Order.number ?? 0) - (b.properties.Order.number ?? 0);
		})
		.map((c) => c.properties.Text.rich_text[0].plain_text);
}

export const prerender = true;

export const load: () => Promise<NotionData> = async () => {
	const response = await notion.databases.query({
		database_id: NOTION_DATABASE_ID
	});

	return parseNotionResponse(response);
};
