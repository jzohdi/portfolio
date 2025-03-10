import { Client } from '@notionhq/client';
import { NOTION_API_KEY, NOTION_DATABASE_ID } from '$env/static/private';
import type { PostsQuery } from '$lib/types/posts';
import type { PostBlock, RichText } from '$lib/types/blocks';
import {
	listAllExperiments,
	listAllPostBlocks,
	listPublishedPostByName,
	listPublishedPosts,
	listPublishedProjects
} from './vite-build';
import type { Experiment, ExperimentsQuery, ExperimentsResult } from '$lib/types/experiments';
import { extractFileUrl, extractRichText, extractTitle } from './helper';
import { EXPERIMENTS_DATABASE } from './constants';

/**
 * For use in svelte server. I need to separate the vite build functions
 * from these functions as during vite build step, the
 * svelte $env is unavailable.
 */

const notion = new Client({ auth: NOTION_API_KEY });
const POSTS_DATABASE_ID = '16b216c9-d0ab-801d-9d5c-f899728f5d75';

export async function getPublishedPosts() {
	return listPublishedPosts(notion);
}

export async function getPublishedProjects() {
	return listPublishedProjects(notion);
}

export async function getAllExperiments() {
	return listAllExperiments(notion);
}

export async function getExperimentByRoute(route: string) {
	const response = await notion.databases.query({
		database_id: EXPERIMENTS_DATABASE,
		filter: {
			property: 'route',
			rich_text: {
				equals: route
			}
		}
	});
	const queryResults = (response as ExperimentsQuery).results;
	if (queryResults.length !== 1) {
		throw new Error('query result returned incorrect number of results: ' + queryResults.length);
	}
	return queryResults[0];
}

export async function getPublishedPostBySlug(slug: string) {
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
					property: 'slug',
					rich_text: {
						equals: slug
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

export async function getPublishedPostByName(name: string) {
	return listPublishedPostByName(notion, name);
}

export async function getTextDatabase() {
	return notion.databases.query({
		database_id: NOTION_DATABASE_ID
	});
}
export type GroupedNumberedList = { type: 'numbered_list'; group: ParsedNLI[] };
export type GroupedBulletedList = { type: 'bulleted_list'; group: ParsedBulletList[] };
export type ParsedElement = GroupedNumberedList | GroupedBulletedList | ParsedEle;

export type ParsedElements = ParsedElement[];

export async function getPageBlocks(pageId: string): Promise<ParsedElements> {
	const blocks = await listAllPostBlocks(notion, pageId);

	const groupLists: ParsedElements = [];
	// let currentGroup = [];
	const parsed = blocks.map(parseBlock);
	for (let i = 0; i < parsed.length; i++) {
		const curr = parsed[i];
		appendItemToGripLists(groupLists, curr);
		// if (curr.type === 'numbered_list_item') {
		// 	currentGroup.push(curr);
		// } else {
		// 	if (currentGroup.length > 0) {
		// 		groupLists.push({ type: 'numbered_list', group: currentGroup } as const);
		// 		currentGroup = [];
		// 	}
		// 	groupLists.push(curr);
		// }
	}

	return groupLists;
}

function getPreviousItem(groupLists: ParsedElements) {
	if (groupLists.length === 0) {
		return undefined;
	}
	return groupLists[groupLists.length - 1];
}

function appendItemToGripLists(groupLists: ParsedElements, block: ParsedBlock) {
	if (block.type === 'bullet_list_item') {
		const lastItem = getPreviousItem(groupLists);
		if (!lastItem || lastItem.type !== 'bulleted_list') {
			return groupLists.push({
				type: 'bulleted_list',
				group: [block]
			});
		}
		return lastItem.group.push(block);
	} else if (block.type === 'numbered_list_item') {
		const lastItem = getPreviousItem(groupLists);
		if (!lastItem || lastItem.type !== 'numbered_list') {
			return groupLists.push({
				type: 'numbered_list',
				group: [block]
			});
		}
		return lastItem.group.push(block);
	}
	groupLists.push(block);
}

export type ParsedBlock = ReturnType<typeof parseBlock>;

function parseBlock(block: PostBlock) {
	const type = block.type;
	switch (type) {
		case 'code':
			return parseCodeBlock(block);
		case 'paragraph':
			return parseParagraphBlock(block);
		case 'numbered_list_item':
			return parseNumberedListItem(block);
		case 'image':
			return parseImageBlock(block);
		case 'heading_3':
			return parseHeading3(block);
		case 'heading_2':
			return parseHeading2(block);
		case 'bulleted_list_item':
			return parseBulletListItem(block);
		default:
			console.error('unhandled block type:', type, block);
			throw new Error('block type not implemented');
	}
}
// these are everything except bullet list and number list item (NLI)
// because those need to be nested grouped later
type ParsedEle = ParsedH2 | ParsedH3 | ParsedP | ParsedCode | ParsedImage;

export type ParsedH2 = ReturnType<typeof parseHeading2>;
export type ParsedH3 = ReturnType<typeof parseHeading3>;
export type ParsedP = ReturnType<typeof parseParagraphBlock>;
export type ParsedNLI = ReturnType<typeof parseNumberedListItem>;
export type ParsedCode = ReturnType<typeof parseCodeBlock>;
export type ParsedImage = ReturnType<typeof parseImageBlock>;
export type ParsedRichText = ReturnType<typeof parseRichText>;
export type ParsedBulletList = ReturnType<typeof parseBulletListItem>;

function parseBulletListItem(block: PostBlock) {
	const content = parseRichText(block.bulleted_list_item?.rich_text);
	return {
		type: 'bullet_list_item',
		content
	} as const;
}

function parseHeading2(block: PostBlock) {
	const content = parseRichText(block.heading_2?.rich_text);
	return {
		type: 'h2',
		content
	} as const;
}

function parseRichText(richText?: RichText[]) {
	if (!richText) {
		return [];
	}
	return richText.map((text) => {
		// console.log(JSON.stringify(text, null, 4));
		return { ...text.text, code: text.annotations.code, bold: text.annotations.bold };
	});
}

function parseHeading3(block: PostBlock) {
	const content = parseRichText(block.heading_3?.rich_text);
	return {
		type: 'h3',
		content
	} as const;
}

function parseImageBlock(block: PostBlock) {
	return {
		type: 'image',
		url: block.image?.file.url as string
	} as const;
}

function parseNumberedListItem(block: PostBlock) {
	return {
		type: 'numbered_list_item',
		content: parseRichText(block.numbered_list_item?.rich_text)
	} as const;
}

function parseParagraphBlock(block: PostBlock) {
	// console.log(JSON.stringify(block, null, 4));
	return {
		type: 'paragraph',
		content: parseRichText(block.paragraph?.rich_text)
	} as const;
}

function parseCodeBlock(block: PostBlock) {
	return {
		type: 'code',
		code: block.code?.rich_text[0].plain_text,
		language: block.code?.language as string
	} as const;
}

export function parseExperiment(exp: ExperimentsResult): Experiment {
	return {
		title: extractTitle(exp.properties.Name),
		thumbnail: extractFileUrl(exp.properties.thumbnail),
		description: extractRichText(exp.properties.description),
		path: extractRichText(exp.properties.route),
		order: exp.properties.order.number
	};
}
