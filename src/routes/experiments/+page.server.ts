import { sortByOrder } from '$lib/notion/helper';
import { getAllExperiments, parseExperiment } from '$lib/notion/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// TODO: probably need to paginate in the future.
	const experiments = await getAllExperiments();
	const compressedProjects = experiments.sort(sortByOrder).map(parseExperiment);
	return { experiments: compressedProjects };
};
