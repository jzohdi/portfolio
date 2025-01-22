import type { RichText, RichTextText } from './blocks';
import type { Experiment } from './experiments';
import type { Project } from './projects';

export type NotionImageUseCase = 'posts' | 'projects' | 'experiments';

export type HomePageData = {
	aboutme1: {
		title: string;
		p: string[];
	};
	aboutme2: {
		title: string;
		p: string[];
	};
	resume: {
		title: string;
		p: string[];
		title2: string;
		li: string[];
	};
	recentPosts: RecentPost[];
	projects: Project[];
	experiments: Experiment[];
};

export interface DatabaseQuery<ResultType> {
	object: string;
	results: Array<ResultType>;
	next_cursor: string | null;
	has_more: boolean;
	type: string;
	page_or_database: never;
	request_id: string;
}

export interface RecentPost {
	title: string;
	description: string;
	slug: string;
	previewImage: string;
}

export interface NotionDatabaseEntry<Properties> {
	object: string;
	id: string;
	created_time: string;
	last_edited_time: string;
	created_by: CreatedBy;
	last_edited_by: LastEditedBy;
	parent: Parent;
	archived: boolean;
	in_trash: boolean;
	properties: Properties;
	url: string;
}

export type TextResult = NotionDatabaseEntry<TextProperties>;

export interface Thumbnail {
	id: string;
	type: string;
	files: File[];
}

export interface CommonName {
	id: string;
	type: string;
	title: Title[];
}

export interface Title {
	type: string;
	text: RichTextText;
	annotations: Annotations2;
	plain_text: string;
	href: string | null;
}

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

export interface TextProperties {
	group: Group;
	Text: Text;
	Name: Name;
	Order: NotionNumber;
}

export interface NotionNumber {
	id: string;
	type: 'number';
	number: null | number;
}

export interface Group {
	id: string;
	type: string;
	select: Select;
}

export interface Select {
	id: string;
	name: string;
	color: string;
}

export interface Text {
	id: string;
	type: string;
	rich_text: RichText[];
}

export interface Annotations {
	bold: boolean;
	italic: boolean;
	strikethrough: boolean;
	underline: boolean;
	code: boolean;
	color: string;
}

export interface Name {
	id: string;
	type: string;
	title: Title[];
}

export interface Title {
	type: string;
	text: RichTextText;
	annotations: Annotations2;
	plain_text: string;
}

export interface Text3 {
	content: string;
}

export interface Annotations2 {
	bold: boolean;
	italic: boolean;
	strikethrough: boolean;
	underline: boolean;
	code: boolean;
	color: string;
}

export interface File {
	name: string;
	type: string;
	file: File2;
}

export interface File2 {
	url: string;
	expiry_time: string;
}

export interface CommonDescription {
	id: string;
	type: string;
	rich_text: Array<RichText>;
}
