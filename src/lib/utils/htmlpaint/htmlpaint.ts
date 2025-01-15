import { fillTextWithWrap } from './fillTextWithWrap';
import { renderTextRow } from './renderTextRow';
import { type AstNode, type ElementNode, type ParsedHtml, type TextNode, type Word } from './types';

export function setupCanvas(tree: ParsedHtml, targetWidth: number) {
	const heightOfTree = calculateHeight(tree);
	const aspectRatio = heightOfTree / tree.rect.width;
	const targetHeight = targetWidth * aspectRatio
	const newCanvas = document.createElement('canvas');
	newCanvas.width = targetWidth * 2;
	newCanvas.height = targetHeight * 2;
	const ctx = newCanvas.getContext('2d');
	if (!ctx) {
		throw new Error("Canvas 2D not suppported.")
	}
	const widthScale = newCanvas.width / tree.rect.width;
	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
	ctx.scale(widthScale, widthScale);
	return { aspectRatio, canvas: newCanvas, ctx, targetHeight }
}

function getStartingPosition(tree: ParsedHtml) {
	for (const row of tree.parsedBody) {
		if (row.type !== 'string') {
			return { x: row.rect.x, y: row.rect.y };
		}
	}
	throw new Error('unsupported operation');
}

function lastElementRect(tree: ParsedHtml) {
	for (let i = tree.parsedBody.length - 1; i >= 0; i--) {
		const node = tree.parsedBody[i];
		if (node.type !== 'string') {
			return node.rect;
		}
	}
	throw new Error('unhandled scenario');
}

export function calculateHeight(tree: ParsedHtml) {
	const { y } = getStartingPosition(tree);
	const { height, top } = lastElementRect(tree);
	return top + height + y;
}

export function toCanvas(ctx: CanvasRenderingContext2D, tree: ParsedHtml): number {
	const { x, y } = getStartingPosition(tree);
	const { height: heightOfLastEle } = lastElementRect(tree);
	return (
		tree.parsedBody
			.filter((row): row is ElementNode => row.type !== 'string' && row.styles.display === 'block')
			.reduce((prevRowTop, row) => {
				renderRow(ctx, row, x, prevRowTop, row.rect.width, 0);
				return row.rect.top;
			}, y) +
		heightOfLastEle +
		y
	);
}

function renderString(
	ctx: CanvasRenderingContext2D,
	row: TextNode,
	x: number,
	y: number,
	boundingWidth: number,
	fontSize: number
) {
	const selfSize = x + boundingWidth;
	if (row.textContent === null) {
		return selfSize;
	}
	ctx.textBaseline = 'top';
	fillTextWithWrap(ctx, row, { x, y, boundingWidth, fontSize });
	return selfSize;
}

function renderBeforeContent(
	ctx: CanvasRenderingContext2D,
	row: ElementNode,
	x: number,
	y: number
) {
	if (row.beforeContent && row.beforeContent !== 'none') {
		const content = row.beforeContent.replaceAll('"', '');
		setFont(ctx, row, 1);
		const measure = ctx.measureText(content);
		ctx.fillText(content, x - measure.width, y);
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
		return renderString(ctx, row, x, y, boundingWidth, fontSize);
	} else {
		const elementBound = row.rect.width ?? 0;
		const startingY = row.rect?.top ?? y;
		const startingX = row.rect?.left ?? x;
		renderBeforeContent(ctx, row, startingX, startingY);
		if (isAllSpanTextRow(row)) {
			renderTextRow(ctx, row, startingX, startingY, elementBound);
			return;
		}
		Array.from(row.children).forEach((child) => {
			renderRow(ctx, child, startingX, startingY, elementBound, setFont(ctx, row, 1));
		});
		return x;
	}
}

function getTextNodeFromSpan(node: ElementNode) {
	const firstChild = node.children[0];
	if (firstChild.type === 'a') {
		return getTextNodeFromSpan(firstChild);
	}
	if (firstChild.type !== 'string') {
		throw new Error('unable to render');
	}
	return {
		textNode: firstChild,
		parent: node
	};
}

/**
 * To be used when we have something like <li><span>some</span><span>text</span></li>
 * where we need to layout all the spans in a word breaking line.
 */
export function flatMapOfText(row: ElementNode): Word[] {
	return row.children.flatMap((child) => {
		if (child.type === 'string') {
			return [];
		}
		const { parent, textNode } = getTextNodeFromSpan(child);
		const text = textNode.textContent;
		if (text === null) {
			return [];
		}
		const styles = getStylesForSpan(parent);
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

export function getStylesForSpan(row: ElementNode) {
	const fontSize = extractFloat(row.styles.fontSize) ?? 1;
	return {
		font: `${row.styles.fontWeight} ${fontSize}px ${row.styles.fontFamily}`,
		fillStyle: row.styles.color,
		fontSize
	};
}

function isAllSpanTextRow(row: AstNode) {
	return (
		row.type === 'li' && row.children.every((c) => c.type === 'span' && c.children.length === 1)
	);
}

function setFont(ctx: CanvasRenderingContext2D, row: ElementNode, widthScale: number) {
	// console.log(row.styles.fontSize);
	const fontSizeNumber = (extractFloat(row.styles.fontSize) ?? 1) * widthScale;
	ctx.font = `${row.styles.fontWeight} ${fontSizeNumber}px ${row.styles.fontFamily}`;
	ctx.fillStyle = row.styles.color;
	return parseInt(row.styles.fontSize);
}
function extractFloat(str: string): number | null {
	const regex = /-?\d*\.?\d+/;
	const match = str.match(regex);
	return match ? parseFloat(match[0]) : null;
}
