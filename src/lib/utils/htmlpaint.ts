export type Document = ReturnType<DOMParser['parseFromString']>;

export async function parse(htmlContent: string): Promise<ParsedHtml> {
	const iframe = await createIframeWithHtml(htmlContent);
	const doc = iframe.contentDocument;

	if (!doc) {
		throw new Error('Failed to load HTML content into iframe.');
	}
	const firstPass = Array.from(doc.childNodes).flatMap((node) => {
		return parseNode(node);
	});
	const bodyNode = firstPass.filter((node) => node?.type === 'body')[0];
	const parsed: ParsedHtml = {
		headElements: firstPass.filter((node) => node?.type === 'meta' || node?.type === 'style'),
		body: bodyNode,
		parsedBody: parseDocument(bodyNode.document.childNodes, { iframe, depth: 0 }),
		iframe
	};
	// document.body.removeChild(iframe);
	return parsed;
}

export type ParsedHtml = {
	headElements: (MetaNode | StyleNode)[];
	body: BodyNode;
	parsedBody: AstNode[];
	iframe: HTMLIFrameElement;
};

export type AstNode = {
	type: string;
	element: ChildNode;
	styles?: CSSStyleDeclaration;
	rect?: DOMRect;
	children: AstNode[];
	depth: number;
};

type AstContext = {
	iframe: HTMLIFrameElement;
	depth: number;
};

function parseDocument(nodes: NodeListOf<ChildNode>, { iframe, depth }: AstContext): AstNode[] {
	return Array.from(nodes).map((child) => {
		const ctxCopy = { iframe, depth: depth + 1 };
		let styles = undefined;
		let rect = undefined;
		if (child.nodeType === Node.ELEMENT_NODE) {
			const element = child as HTMLElement;
			styles = iframe.contentWindow?.getComputedStyle(element);
			rect = element.getBoundingClientRect();
		}
		return {
			type: getType(child),
			styles,
			element: child,
			rect,
			children: parseDocument(child.childNodes, ctxCopy),
			depth: depth
		};
	});
}

function getType(child: ChildNode) {
	if (child.nodeType === Node.ELEMENT_NODE) {
		const element = child as HTMLElement;
		return element.tagName.toLowerCase();
	}
	if (child.nodeType === Node.TEXT_NODE) {
		return 'string';
	}
	return 'not supported';
}

type MetaNode = {
	type: 'meta';
	attributes: Record<string, string>;
};

type StyleNode = {
	type: 'style';
	content: string;
};

type BodyNode = {
	type: 'body';
	tagName: string;
	attributes: Record<string, string>;
	document: HTMLBodyElement;
};

type ParseNode = MetaNode | StyleNode | BodyNode;

// Helper function to extract attributes from an element
function getAttributes(element: Element): Record<string, string> {
	const attributes: Record<string, string> = {};
	for (const attr of element.attributes) {
		attributes[attr.name] = attr.value;
	}
	return attributes;
}

// Recursive parser
function parseNode(node: Node): ParseNode | ParseNode[] | null {
	if (node.nodeType === Node.ELEMENT_NODE) {
		const element = node as HTMLElement;
		switch (element.tagName.toLowerCase()) {
			case 'head':
				return parseHead(element as HTMLHeadElement);
			case 'meta':
				return {
					type: 'meta',
					attributes: getAttributes(element)
				};
			case 'style':
				return {
					type: 'style',
					content: element.textContent || ''
				};
			case 'html':
				return parseHtmlDoc(element as HTMLHtmlElement);
			case 'body':
				return {
					type: 'body',
					tagName: element.tagName.toLowerCase(),
					attributes: getAttributes(element),
					document: element as HTMLBodyElement
				};
			default:
				return null;
		}
	}

	return null;
}

function parseHtmlDoc(htmlDoc: HTMLHtmlElement) {
	const results = Array.from(htmlDoc.childNodes)
		.flatMap((node) => parseNode(node))
		.filter((node) => !!node);
	if (!results) {
		return null;
	}
	return results;
}

function parseHead(headEle: HTMLHeadElement) {
	const results = Array.from(headEle.childNodes)
		.flatMap((node) => parseNode(node))
		.filter((node) => !!node);
	if (!results) {
		return null;
	}
	return results;
}

function createIframeWithHtml(htmlContent: string): Promise<HTMLIFrameElement> {
	return new Promise((resolve) => {
		const iframe = document.createElement('iframe');
		iframe.style.position = 'absolute';
		iframe.style.left = '-9999px';
		iframe.style.top = '-9999px';

		iframe.onload = () => {
			const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
			if (iframeDoc) {
				iframeDoc.open();
				iframeDoc.write(htmlContent);
				iframeDoc.close();
			}

			resolve(iframe);
		};

		document.body.appendChild(iframe);
	});
}
