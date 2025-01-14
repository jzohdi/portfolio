import type { NotionData, NotionResult } from '$lib/types/types';
import { Client } from '@notionhq/client';
import type { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';
import { NOTION_API_KEY, NOTION_DATABASE_ID } from '$env/static/private';
import type { PostsQuery } from '$lib/types/posts';

const notion = new Client({ auth: NOTION_API_KEY });
const POSTS_DATABASE_ID = "16b216c9-d0ab-801d-9d5c-f899728f5d75";


function parseNotionResponse(response: QueryDatabaseResponse, collector: NotionData) {
	const results = response.results as NotionResult[];
	const aboutme1Content = results.filter((r) => r.properties.group.select?.name === 'aboutme1');
	const aboutme2Content = results.filter((r) => r.properties.group.select?.name === 'aboutme2');
	const resumeContent = results.filter((r) => r.properties.group.select?.name === 'resume');
	collector.aboutme1 ={
			title: getContentByType(aboutme1Content, 'title')[0],
			p: getContentByType(aboutme1Content, 'p')
		}
	collector.aboutme2 = {
		title: getContentByType(aboutme2Content, 'title')[0],
		p: getContentByType(aboutme2Content, 'p')
	}
	collector.resume = {
		title: getContentByType(resumeContent, 'title')[0],
		p: getContentByType(resumeContent, 'p'),
		title2: getContentByType(resumeContent, 'title2')[0],
		li: getContentByType(resumeContent, 'li')
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

async function loadHomePageText(collector: NotionData) {
	const response = await notion.databases.query({
		database_id: NOTION_DATABASE_ID
	});

	return parseNotionResponse(response, collector);	
}

async function loadRecentPosts(collector: NotionData) {
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
	const results = response.results.filter((result) => {
		return result.properties['Publish Date'].date !== null
	});
	collector.recentPosts =  results.slice(0, 2).map((result) => {
		return {
			title: result.properties.Name.title[0].plain_text,
			description: result.properties["SEO Description"].rich_text[0].plain_text,
			slug: result.properties.slug.rich_text[0].plain_text,
			previewImage: result.properties.thumbnail.files[0].file.url
		}

	})
	return collector;
}

export const load: () => Promise<NotionData> = async () => {
	const collector: NotionData = {
		aboutme1: {
			title: "",
			p: []
		},
		aboutme2: {
			title: "",
			p: []
		},
		resume: {
			title: "",
			p: [],
			title2: "",
			li: []
		},
		recentPosts: []
	};
	await Promise.all([loadHomePageText(collector), loadRecentPosts(collector)])
	return collector;
};
