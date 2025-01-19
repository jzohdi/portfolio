import { Client } from '@notionhq/client';
import { NOTION_API_KEY, NOTION_DATABASE_ID } from '$env/static/private';
import type { PostsQuery } from '$lib/types/posts';
import type { PostBlock } from '$lib/types/blocks';
import type { NotionNumber, RichText } from '$lib/types/types';
import { listAllPostBlocks, listPublishedPostByName, listPublishedPosts, listPublishedProjects} from './vite-build';

const notion = new Client({ auth: NOTION_API_KEY });
const POSTS_DATABASE_ID = "16b216c9-d0ab-801d-9d5c-f899728f5d75";

interface TypeWithOrder {
	properties: {
		order: NotionNumber
	}
}

export function sortByOrder(a: TypeWithOrder, b: TypeWithOrder) {
	
	return (a.properties?.order?.number ?? Number.MAX_SAFE_INTEGER) - (b.properties.order.number?? Number.MAX_SAFE_INTEGER)
}

export async function getPublishedPosts() {
    return listPublishedPosts(notion);
}

export async function getPublishedProjects() {
	return listPublishedProjects(notion);
}

export async function getPublishedPostBySlug(slug: string) {
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
					property: "slug",
					rich_text: {
						equals: slug
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

export async function getPublishedPostByName(name: string) {
	return listPublishedPostByName(notion, name);
}

export async function getTextDatabase() {
    return notion.databases.query({
		database_id: NOTION_DATABASE_ID
	});
}
export type ParsedElement = { type: "numbered_list", group: ParsedNLI[]} | ParsedEle;

export type ParsedElements = ({ type: "numbered_list", group: ParsedNLI[]}| ParsedEle)[];


export async function getPageBlocks(pageId: string): Promise<ParsedElements> {
	const blocks = await listAllPostBlocks(notion, pageId);
  
	const groupLists = [];
	let currentGroup = [];
	const parsed = blocks.map(parseBlock);
	for (let i = 0; i < parsed.length; i++) {
		const curr = parsed[i];
		if (curr.type === "numbered_list_item") {
				currentGroup.push(curr)
		} else {
			if (currentGroup.length > 0) {
				groupLists.push({type: "numbered_list", group: currentGroup} as const);
				currentGroup = [];
			}
			groupLists.push(curr);
		}
	}

	return groupLists
}

export type ParsedBlock = ReturnType<typeof parseBlock>;

function parseBlock(block: PostBlock) {
	const type = block.type;
	switch(type) {
		case "code":
			return parseCodeBlock(block)
		case "paragraph":
			return parseParagraphBlock(block)
		case "numbered_list_item":
			return parseNumberedListItem(block);
		case "image":
			return parseImageBlock(block);
		case "heading_3":
			return parseHeading3(block);
		case "heading_2":
			return parseHeading2(block);
		default:
			console.error("unhandled block type:", type, block);
			throw new Error("block type not implemented")
	}
}
type ParsedEle = ParsedH2 | ParsedH3 | ParsedP | ParsedCode | ParsedImage;

export type ParsedH2 = ReturnType<typeof parseHeading2>;
export type ParsedH3 = ReturnType<typeof parseHeading3>;
export type ParsedP = ReturnType<typeof parseParagraphBlock>;
export type ParsedNLI = ReturnType<typeof parseNumberedListItem>;
export type ParsedCode = ReturnType<typeof parseCodeBlock>;
export type ParsedImage = ReturnType<typeof parseImageBlock>;

function parseHeading2(block: PostBlock) {
	const content = parseRichText(block.heading_2?.rich_text)
	return {
		type: "h2",
		content 
	} as const;
}

function parseRichText(richText?: RichText[]) {
	if (!richText) {
		return "";
	}
	return richText.map((text) => {
		return text.plain_text;
	}).join(" ")
}

function parseHeading3(block: PostBlock) {
	const content = parseRichText(block.heading_3?.rich_text);
	return {
		type: "h3",
		content
	} as const;
}

function parseImageBlock(block: PostBlock) {
	return {
		type: "image",
		url: block.image?.file.url as string
	} as const;
}

function parseNumberedListItem(block: PostBlock) {
	return {
		type: "numbered_list_item",
		content: parseRichText(block.numbered_list_item?.rich_text)
	} as const;
}

function parseParagraphBlock(block: PostBlock) {
	return {
		type: "paragraph",
		content: parseRichText(block.paragraph?.rich_text)
	} as const;
}

function parseCodeBlock(block: PostBlock) {
	return {
		type: "code",
		code: parseRichText(block.code?.rich_text),
		language: block.code?.language as string
	} as const;
}