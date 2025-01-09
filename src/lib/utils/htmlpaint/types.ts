import type { getStylesForSpan } from './htmlpaint';

export type Word = {
	word: string;
	styles: ReturnType<typeof getStylesForSpan>;
	hasSpaceAfter: boolean;
};
export type TextRenderDetails = {
	x: number;
	y: number;
	fontSize: number;
	boundingWidth: number;
};
export type ParsedHtml = {
	headElements: (MetaNode | StyleNode)[];
	body: BodyNode;
	parsedBody: AstNode[];
	rect: DOMRect;
	iframe: HTMLIFrameElement;
};

export type TextNode = {
	type: 'string';
	textContent: null | string;
};
const supportedTags = new Set<ElementNode['type']>(['span', 'p', 'ul', 'li', 'a']);
export function isSupportedTag(tagName: string): tagName is ElementNode['type'] {
	return supportedTags.has(tagName as ElementNode['type']);
}

export type ElementNode = {
	type: 'span' | 'p' | 'ul' | 'li' | 'a';
	styles: CSSStyleDeclaration;
	rect: DOMRect;
	beforeContent?: string;
	children: AstNode[];
};

export type AstNode = ElementNode | TextNode;
export type AstContext = {
	iframe: HTMLIFrameElement;
};
export type MetaNode = {
	type: 'meta';
	attributes: Record<string, string>;
};

export type StyleNode = {
	type: 'style';
	content: string;
};

export type BodyNode = {
	type: 'body';
	tagName: string;
	attributes: Record<string, string>;
	children: NodeListOf<ChildNode>;
};
export type ParseNode = MetaNode | StyleNode | BodyNode;
