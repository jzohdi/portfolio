import { getExperimentByRoute, getPageBlocks, parseExperiment } from '$lib/notion/server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	// TODO: probably need to paginate in the future.
	const experiment = await getExperimentByRoute('graphing-calculator');
	const blocks = await getPageBlocks(experiment.id);
	return { experiment: parseExperiment(experiment), blocks };
};
