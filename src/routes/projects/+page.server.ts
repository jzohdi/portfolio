import { extractRelventPageData } from "$lib/notion/helper";
import { getPublishedProjects } from "$lib/notion/server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    // TODO: probably need to paginate in the future.
	const projects = await getPublishedProjects();
    const compressedProjects = extractRelventPageData(projects);
    return { projects: compressedProjects }
};
