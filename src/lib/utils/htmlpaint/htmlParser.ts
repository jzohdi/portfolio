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
	const styleTags = firstPass.filter((node): node is StyleNode => node?.type === 'style');
	await appendStyles([...styleTags]);

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

export function appendStyles(styleNodes: StyleNode[]): Promise<HTMLStyleElement[]> {
	return Promise.all(
		styleNodes.map(
			(node) =>
				new Promise<HTMLStyleElement>((resolve) => {
					const tag = document.createElement('style');

					extractContentToLoad(node.content).then((content) => {
						if (!content) {
							return resolve(tag);
						}
						const fontFaceRegex = /@font-face\s*{[^}]*}/gi;
						const fontFaceBlocks = content.match(fontFaceRegex);
						if (fontFaceBlocks === null) {
							return resolve(tag);
						}
						const parsedFonts = fontFaceBlocks.map(parseFontFaceBlock);
						loadFonts(parsedFonts).then(() => {
							resolve(tag);
						});
					});
				})
		)
	);
}

async function extractContentToLoad(content: string): Promise<string> {
	const pattern = /@import\s+url\(\s*(['"]?)(.*?)\1\s*\)/i;
	const match = content.match(pattern);
	try {
		if (match) {
			const url = match[2];
			const result = await fetch(url);
			const text = await result.text();
			if (text.includes('@font-face')) {
				return text;
			}
			return '';
			// Output: https://themes.googleusercontent.com/fonts/css?kit=fpjTOVmNbO4Lz34iLyptLUXza5VhXqVC6o75Eld_V98
		} else {
			return '';
		}
	} catch (e) {
		console.error(e);
		return '';
	}
}

async function loadFonts(fonts: ReturnType<typeof parseFontFaceBlock>[]) {
	for (const font of fonts) {
		if (font.fontFamily && font.srcUrl) {
			const fontFace = new FontFace(
				font.fontFamily,
				`url(${font.srcUrl}) format('${font.format}')`,
				{
					style: font.fontStyle,
					weight: font.fontWeight
				}
			);

			try {
				await fontFace.load();
				document.fonts.add(fontFace);
				console.log(`Loaded font: ${font.fontFamily} (${font.fontWeight})`);
			} catch (error) {
				console.error(`Failed to load font: ${font.fontFamily} (${font.fontWeight})`, error);
			}
		}
	}
}

function parseFontFaceBlock(block: string) {
	const fontFamilyMatch = block.match(/font-family:\s*['"]?([^;'"]+)['"]?;/i);
	const fontStyleMatch = block.match(/font-style:\s*([^;]+);/i);
	const fontWeightMatch = block.match(/font-weight:\s*([^;]+);/i);
	const srcMatch = block.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?([^)'"]+)['"]?\);/i);

	return {
		fontFamily: fontFamilyMatch ? fontFamilyMatch[1].trim() : null,
		fontStyle: fontStyleMatch ? fontStyleMatch[1].trim() : 'normal',
		fontWeight: fontWeightMatch ? fontWeightMatch[1].trim() : '400',
		srcUrl: srcMatch ? srcMatch[1].trim() : null,
		format: srcMatch ? srcMatch[2].trim() : null
	};
}
