export type NotionData = {
	aboutme1: {
		title: string;
		p: string[];
	};
	aboutme2: {
		title: string;
		p: string[];
	};
};

export interface NotionResult {
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
	group: Group;
	Text: Text;
	Name: Name;
	Order: {
		id: string;
		type: 'number';
		number: null | number;
	};
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

export interface RichText {
	type: string;
	text: Text2;
	annotations: Annotations;
	plain_text: string;
}

export interface Text2 {
	content: string;
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
	text: Text3;
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
