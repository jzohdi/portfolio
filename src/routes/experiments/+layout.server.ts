import { sortByOrder } from '$lib/notion/helper';
import { getAllExperiments, parseExperiment } from '$lib/notion/server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	// TODO: probably need to paginate in the future.
	const experiments = await getAllExperiments();
	const compressedProjects = experiments.sort(sortByOrder).map(parseExperiment);
	return { experiments: compressedProjects };
};
