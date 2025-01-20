import type { ProjectResult } from '$lib/types/projects';
import type { File, NotionNumber, RichText, Title } from '$lib/types/types';

interface TypeWithOrder {
	properties: {
		order: NotionNumber;
	};
}

export function sortByOrder(a: TypeWithOrder, b: TypeWithOrder) {
	return (
		(b.properties.order.number ?? Number.MAX_SAFE_INTEGER) -
		(a.properties?.order?.number ?? Number.MAX_SAFE_INTEGER)
	);
}

export type Projects = ReturnType<typeof extractRelventPageData>;

export function extractRelventPageData(projects: ProjectResult[]) {
	return projects.sort(sortByOrder).map((project) => {
		return {
			title: extractTitle(project.properties.Name), // project.properties.Name.title[0].plain_text,
			description: extractRichText(project.properties.description),
			thumbnail: extractFileUrl(project.properties.thumbnail),
			link: project.properties.link.url,
			source: project.properties.source.url
		};
	});
}

export function extractFileUrl(property: { files: File[] }) {
	return property.files[0].file.url;
}

export function extractTitle(property: { title: Title[] }): string {
	return property.title[0].plain_text;
}

export function extractRichText(property: { rich_text: RichText[] }) {
	return property.rich_text.map((rt) => rt.plain_text).join(' ');
}
