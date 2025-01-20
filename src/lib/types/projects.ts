import type {
	CommonDescription,
	CommonName,
	DatabaseQuery,
	NotionDatabaseEntry,
	NotionNumber,
	Thumbnail
} from './types';

export type Project = {
	title: string;
	link: string;
	thumbnail: string;
	description: string;
	source?: string;
};

export type ProjectsQuery = DatabaseQuery<ProjectResult>;
export type ProjectResult = NotionDatabaseEntry<Properties>;

export interface CreatedBy {
	object: string;
	id: string;
}

export interface LastEditedBy {
	object: string;
	id: string;
}

export interface Parent {
	type: string;
	database_id: string;
}

export interface Properties {
	published: Published;
	link: Link;
	description: CommonDescription;
	thumbnail: Thumbnail;
	Name: CommonName;
	source: Link;
	order: NotionNumber;
}

export interface Published {
	id: string;
	type: string;
	checkbox: boolean;
}

export interface Link {
	id: string;
	type: string;
	url: string;
}

export interface Text {
	content: string;
	link: string | null;
}

export interface Annotations {
	bold: boolean;
	italic: boolean;
	strikethrough: boolean;
	underline: boolean;
	code: boolean;
	color: string;
}

export interface Text2 {
	content: string;
	link: string | null;
}

export interface Annotations2 {
	bold: boolean;
	italic: boolean;
	strikethrough: boolean;
	underline: boolean;
	code: boolean;
	color: string;
}
