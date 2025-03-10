export type PostBlocks = PostBlock[];

export interface PostBlock {
	object: string;
	id: string;
	parent: Parent;
	created_time: string;
	last_edited_time: string;
	created_by: CreatedBy;
	last_edited_by: LastEditedBy;
	has_children: boolean;
	archived: boolean;
	in_trash: boolean;
	type: string;
	numbered_list_item?: NumberedListItem;
	bulleted_list_item?: BulletedListItem;
	paragraph?: Paragraph;
	image?: Image;
	code?: Code;
	heading_3?: Heading3;
	heading_2?: Heading2;
}

export interface Parent {
	type: string;
	page_id: string;
}

export interface CreatedBy {
	object: string;
	id: string;
}

export interface LastEditedBy {
	object: string;
	id: string;
}

export interface NumberedListItem {
	rich_text: RichText[];
	color: string;
}

export interface BulletedListItem {
	rich_text: RichText[];
	color: string;
}

export interface RichText {
	type: string;
	text: RichTextText;
	annotations: Annotations;
	plain_text: string;
	href: string | null;
}

export interface RichTextText {
	content: string;
	link: Link | null;
}

export interface Annotations {
	bold: boolean;
	italic: boolean;
	strikethrough: boolean;
	underline: boolean;
	code: boolean;
	color: string;
}

export interface Paragraph {
	rich_text: RichText[];
	color: string;
}

export interface Link {
	url: string | null;
}

export interface Annotations2 {
	bold: boolean;
	italic: boolean;
	strikethrough: boolean;
	underline: boolean;
	code: boolean;
	color: string;
}

export interface Image {
	caption: never;
	type: string;
	file: File;
}

export interface File {
	url: string;
	expiry_time: string;
}

export interface Code {
	caption: never;
	rich_text: RichText[];
	language: string;
}

export interface Annotations3 {
	bold: boolean;
	italic: boolean;
	strikethrough: boolean;
	underline: boolean;
	code: boolean;
	color: string;
}
export interface Heading2 {
	rich_text: RichText[];
	is_toggleable: boolean;
	color: string;
}

export interface Heading3 {
	rich_text: RichText[];
	is_toggleable: boolean;
	color: string;
}

export interface Annotations4 {
	bold: boolean;
	italic: boolean;
	strikethrough: boolean;
	underline: boolean;
	code: boolean;
	color: string;
}
