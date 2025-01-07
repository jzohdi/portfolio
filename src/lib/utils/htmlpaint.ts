function getStartingPosition(tree: ParsedHtml) {
	for (const row of tree.parsedBody) {
		if (row.type !== 'string') {
			return { x: row.rect.x, y: row.rect.y };
		}
	}
	return { x: 0, y: 0 };
}

export function toCanvas(ctx: CanvasRenderingContext2D, tree: ParsedHtml) {
	const { x, y } = getStartingPosition(tree);
	let currentY = y;
	for (const row of tree.parsedBody) {
		if (row.type !== 'string' && row.styles.display === 'block') {
			renderRow(ctx, row, x, currentY, row.rect.width, 0);
			currentY += row.rect.height;
		}
	}
}

function renderRow(
	ctx: CanvasRenderingContext2D,
	row: AstNode,
	x: number,
	y: number,
	boundingWidth: number,
	fontSize: number
) {
	if (row.type === 'string') {
		const selfSize = x + boundingWidth;
		if (row.textContent === null) {
			return selfSize;
		}
		ctx.textBaseline = 'top';
		fillTextWithWrap(ctx, row, { x, y, boundingWidth, fontSize });
		// ctx.fillText(element.textContent, x, y - fontSize);
		return selfSize;
	} else {
		const elementBound = row.rect?.width ?? 0;
		y = row.rect?.top ?? y;
		x = row.rect?.left ?? x;

		if (row.beforeContent && row.beforeContent !== 'none') {
			const content = row.beforeContent.replaceAll('"', '');
			setFont(ctx, row);
			const measure = ctx.measureText(content);
			ctx.fillText(content, x - measure.width, y);
		}

		if (isAllSpanTextRow(row)) {
			renderTextRow(ctx, row, x, y, elementBound);
			return;
		}
		Array.from(row.children).forEach((child) => {
			renderRow(ctx, child, x, y, elementBound, setFont(ctx, row));
		});
		return x;
	}
}

type Word = {
	word: string;
	styles: ReturnType<typeof getStylesForSpan>;
	hasSpaceAfter: boolean;
};

/**
 * To be used when we have something like <li><span>some</span><span>text</span></li>
 * where we need to layout all the spans in a word breaking line.
 */
function flatMapOfText(row: ElementNode): Word[] {
	return row.children.flatMap((child) => {
		if (child.type === 'string') {
			return [];
		}
		let styles = getStylesForSpan(child);
		let firstChild = child.children[0];
		if (firstChild.type === 'a') {
			const nextChild = firstChild.children[0];
			styles = getStylesForSpan(firstChild);
			firstChild = nextChild;
		}
		if (firstChild.type !== 'string') {
			return [];
		}
		const text = firstChild.textContent;
		if (text === null) {
			return [];
		}
		const words = text.split(' ');
		return words.map((word, i) => {
			return {
				word,
				styles,
				hasSpaceAfter: i !== words.length - 1
			};
		});
	});
}

function renderTextRow(
	ctx: CanvasRenderingContext2D,
	row: ElementNode,
	x: number,
	y: number,
	boundingWidth: number
) {
	const makeChildTextMap: Word[] = flatMapOfText(row);
	ctx.textBaseline = 'top';
	const lines: Word[][] = [];
	let currentString = '';
	let currentLine: Word[] = [];
	for (const word of makeChildTextMap) {
		ctx.font = word.styles.font;
		const testString = currentString ? `${currentString} ${word.word}` : word.word;
		const testWidth = ctx.measureText(testString).width;

		if (testWidth > boundingWidth + 5 && currentLine) {
			// Push current line to lines and start a new one
			currentString = word.word;
			lines.push(currentLine);
			currentLine = [word];
		} else {
			currentString = testString;
			currentLine.push(word);
		}
	}

	// Push the last line if any
	if (currentLine) {
		lines.push(currentLine);
	}

	//fill rest of function here
	// Render each line
	let currentY = y; // Track the current y position
	for (const line of lines) {
		let currentX = x; // Track the current x position for the line

		for (const word of line) {
			// Apply word-specific styles
			ctx.font = word.styles.font;
			ctx.fillStyle = word.styles.fillStyle;

			// Render the word
			ctx.fillText(word.word, currentX, currentY);

			// Update currentX based on the word's width
			const wordWidth = ctx.measureText(word.word).width;
			currentX += wordWidth;
			if (word.hasSpaceAfter) {
				currentX += ctx.measureText(' ').width;
			}
		}

		// Move to the next line
		currentY += line[0].styles.fontSize;
	}
}

function getStylesForSpan(row: ElementNode) {
	return {
		font: `${row.styles.fontWeight} ${row.styles.fontSize} ${row.styles.fontFamily}`,
		fillStyle: row.styles.color,
		fontSize: parseInt(row.styles.fontSize)
	};
}

function isAllSpanTextRow(row: AstNode) {
	return (
		row.type === 'li' && row.children.every((c) => c.type === 'span' && c.children.length === 1)
	);
}

type TextRenderDetails = {
	x: number;
	y: number;
	fontSize: number;
	boundingWidth: number;
};

/**
 * Used for simple text nodes that need to be word wrapped using binary search.
 */
function fillTextWithWrap(
	ctx: CanvasRenderingContext2D,
	node: TextNode,
	details: TextRenderDetails
) {
	if (!node.textContent) {
		return;
	}

	const text = node.textContent;
	const words = text.split(' ');
	const lines: string[] = [];
	const boundingWidth = details.boundingWidth + 5; // Adjusted bounding width
	const fontSize = details.fontSize;
	const x = details.x;
	const y = details.y;

	let start = 0;
	const totalWords = words.length;

	while (start < totalWords) {
		let low = start;
		let high = totalWords;
		let mid = start;
		let lastValid = start;

		// Binary search to find the maximum number of words that fit in the current line
		while (low < high) {
			mid = Math.floor((low + high) / 2);
			const currentSlice = words.slice(start, mid + 1);
			const testLine = currentSlice.join(' ');
			const testWidth = ctx.measureText(testLine).width;

			if (testWidth <= boundingWidth) {
				// Current slice fits, try to fit more words
				lastValid = mid + 1;
				low = mid + 1;
			} else {
				// Current slice does not fit, reduce the number of words
				high = mid;
			}
		}

		// Determine the end index for the current line
		const end = Math.min(lastValid, totalWords);
		const lineWords = words.slice(start, end);
		const line = lineWords.join(' ');
		lines.push(line);

		// Update the start index for the next iteration
		start = end;
	}

	// Render each line with adjusted y-coordinate
	lines.forEach((line, index) => {
		ctx.fillText(line, x, y + index * fontSize);
	});
}

function setFont(ctx: CanvasRenderingContext2D, row: ElementNode) {
	ctx.font = `${row.styles.fontWeight} ${row.styles.fontSize} ${row.styles.fontFamily}`;
	ctx.fillStyle = row.styles.color;
	return parseInt(row.styles.fontSize);
}

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

function isSupportedTag(tagName: string): tagName is ElementNode['type'] {
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

type AstContext = {
	iframe: HTMLIFrameElement;
};

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
	children: NodeListOf<ChildNode>;
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
