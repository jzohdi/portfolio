import {
	type ParsedHtml,
	type AstContext,
	type AstNode,
	isSupportedTag,
	type ParseNode,
	type StyleNode
} from './types';

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
		rect: iframe.contentDocument.body.getBoundingClientRect(),
		parsedBody: parseDocument(bodyNode.children, { iframe }),
		iframe
	};
	// document.body.removeChild(iframe);
	return parsed;
}
function parseDocument(nodes: NodeListOf<ChildNode>, { iframe }: AstContext): AstNode[] {
	return Array.from(nodes).map((child) => {
		// debugger;
		if (child.nodeType === Node.TEXT_NODE) {
			return {
				type: 'string',
				textContent: child.textContent
			};
		}
		if (child.nodeType === Node.ELEMENT_NODE) {
			const element = child as HTMLElement;
			const styles = iframe.contentWindow?.getComputedStyle(element);
			const rect = element.getBoundingClientRect();
			if (!styles) {
				// TODO: telemetry
				console.error('could not get styles from iframe for element:', element);
				throw new Error('Failed to parseDocument.');
			}
			const beforeContent = iframe.contentWindow?.getComputedStyle(element, ':before').content;
			return {
				type: getType(child),
				styles,
				rect,
				beforeContent,
				children: parseDocument(child.childNodes, { iframe })
			};
		}
		console.error('unsupported nodeType');
		throw new Error('Failed to parseDocument');
	});
}
function getType(child: ChildNode) {
	if (child.nodeType === Node.ELEMENT_NODE) {
		const element = child as HTMLElement;
		const tagName = element.tagName.toLowerCase();
		if (isSupportedTag(tagName)) {
			return tagName;
		}
	}
	throw new Error('element tag not supported for parsing');
}
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
					children: (element as HTMLBodyElement).childNodes
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
		iframe.width = '1024px';
		iframe.height = '2048px';
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

export function appendStyles(tree: ParsedHtml): Promise<HTMLStyleElement[]> {
	return Promise.all(tree.headElements.filter((node): node is StyleNode => node.type==="style").map((node => {
		return new Promise<HTMLStyleElement>((resolve) => {
			const tag = document.createElement("style")
			tag.innerHTML = node.content;
			document.fonts.ready.then(() => {
				resolve(tag)
			})
			document.head.appendChild(tag);
			
			return tag;
		})
	})));
}
