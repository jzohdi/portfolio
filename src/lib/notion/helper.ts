import type { ProjectResult } from "$lib/types/projects"
import type { NotionNumber } from "$lib/types/types"

interface TypeWithOrder {
	properties: {
		order: NotionNumber
	}
}

export function sortByOrder(a: TypeWithOrder, b: TypeWithOrder) {
	return (b.properties.order.number?? Number.MAX_SAFE_INTEGER) - (a.properties?.order?.number ?? Number.MAX_SAFE_INTEGER)
}

export type Projects = ReturnType<typeof extractRelventPageData>;

export function extractRelventPageData(projects: ProjectResult[]) {
    return projects.sort(sortByOrder).map((project) => {
        return {
            title: project.properties.Name.title[0].plain_text,
            description: project.properties.description.rich_text[0].plain_text,
            thumbnail: project.properties.thumbnail.files[0].file.url,
            link: project.properties.link.url,
            source: project.properties.source.url
        }
    })
}