import type {
	CommonDescription,
	CommonName,
	DatabaseQuery,
	NotionDatabaseEntry,
	NotionNumber,
	RichText,
	Thumbnail
} from './types';

export type Experiment = {
	title: string;
	path: string;
	order: number | null;
	thumbnail: string;
	description: string;
};

export type ExperimentsQuery = DatabaseQuery<ExperimentsResult>;
export type ExperimentsResult = NotionDatabaseEntry<ExperimentProperties>;

interface ExperimentProperties {
	order: NotionNumber;
	thumbnail: Thumbnail;
	Name: CommonName;
	route: Route;
	description: CommonDescription;
}

interface Route {
	id: string;
	type: string;
	rich_text: Array<RichText>;
}
