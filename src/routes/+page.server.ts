import type { HomePageData, TextResult } from '$lib/types/types';
import type { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';
import {
	getAllExperiments,
	getPublishedPosts,
	getPublishedProjects,
	getTextDatabase,
	parseExperiment
} from '$lib/notion/server';
import { extractFileUrl, extractRichText, extractTitle, sortByOrder } from '$lib/notion/helper';

function parseNotionResponse(response: QueryDatabaseResponse, collector: HomePageData) {
	const results = response.results as TextResult[];
	const aboutme1Content = results.filter((r) => r.properties.group.select?.name === 'aboutme1');
	const aboutme2Content = results.filter((r) => r.properties.group.select?.name === 'aboutme2');
	const resumeContent = results.filter((r) => r.properties.group.select?.name === 'resume');
	collector.aboutme1 = {
		title: getContentByType(aboutme1Content, 'title')[0],
		p: getContentByType(aboutme1Content, 'p')
	};
	collector.aboutme2 = {
		title: getContentByType(aboutme2Content, 'title')[0],
		p: getContentByType(aboutme2Content, 'p')
	};
	collector.resume = {
		title: getContentByType(resumeContent, 'title')[0],
		p: getContentByType(resumeContent, 'p'),
		title2: getContentByType(resumeContent, 'title2')[0],
		li: getContentByType(resumeContent, 'li')
	};

	return collector;
}

function getContentByType(results: TextResult[], type: 'p' | 'title' | 'title2' | 'li') {
	return results
		.filter((c) => c.properties?.Name.title[0].text.content === type)
		.sort((a, b) => {
			return (a.properties.Order.number ?? 0) - (b.properties.Order.number ?? 0);
		})
		.map((c) => c.properties.Text.rich_text[0].plain_text);
}

export const prerender = true;

async function loadHomePageText(collector: HomePageData) {
	const response = await getTextDatabase();

	return parseNotionResponse(response, collector);
}

async function loadRecentPosts(collector: HomePageData) {
	const results = await getPublishedPosts();
	collector.recentPosts = results.slice(0, 2).map((result) => {
		return {
			title: extractTitle(result.properties.Name),
			description: extractRichText(result.properties['SEO Description']),
			slug: extractRichText(result.properties.slug),
			previewImage: extractFileUrl(result.properties.thumbnail)
		};
	});
	return collector;
}

async function loadProjects(collector: HomePageData) {
	const results = await getPublishedProjects();
	collector.projects = results.sort(sortByOrder).map((project) => {
		return {
			title: extractTitle(project.properties.Name),
			description: extractRichText(project.properties.description),
			thumbnail: extractFileUrl(project.properties.thumbnail),
			link: project.properties.link.url,
			source: project.properties.source.url
		};
	});
}

async function loadExperiments(collector: HomePageData) {
	const results = await getAllExperiments();
	collector.experiments = results.sort(sortByOrder).map(parseExperiment);
}

export const load: () => Promise<HomePageData> = async () => {
	const collector: HomePageData = {
		aboutme1: {
			title: '',
			p: []
		},
		aboutme2: {
			title: '',
			p: []
		},
		resume: {
			title: '',
			p: [],
			title2: '',
			li: []
		},
		recentPosts: [],
		projects: [],
		experiments: []
	};
	await Promise.all([
		loadHomePageText(collector),
		loadRecentPosts(collector),
		loadProjects(collector),
		loadExperiments(collector)
	]);
	return collector;
};
