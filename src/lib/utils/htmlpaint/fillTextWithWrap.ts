import type { TextNode, TextRenderDetails } from './types';

/**
 * Used for simple text nodes that need to be word wrapped using binary search.
 */
export function fillTextWithWrap(
	ctx: CanvasRenderingContext2D,
	node: TextNode,
	details: TextRenderDetails
): void {
	if (!node.textContent) return;

	const lines = getWrappedLines(ctx, node.textContent, details.boundingWidth + 5);

	lines.forEach((line, index) => {
		ctx.fillText(line, details.x, details.y + index * details.fontSize);
	});
}
function getWrappedLines(
	ctx: CanvasRenderingContext2D,
	text: string,
	boundingWidth: number
): string[] {
	const words = text.split(' ');
	const lines: string[] = [];
	let start = 0;
	const totalWords = words.length;

	while (start < totalWords) {
		const end = findMaxFittingWords(ctx, words, start, boundingWidth);
		const lineWords = words.slice(start, end);
		lines.push(lineWords.join(' '));
		start = end;
	}

	return lines;
}
function findMaxFittingWords(
	ctx: CanvasRenderingContext2D,
	words: string[],
	start: number,
	boundingWidth: number
): number {
	let low = start;
	let high = words.length;
	let lastValid = start;

	while (low < high) {
		const mid = Math.floor((low + high) / 2);
		const testLine = words.slice(start, mid + 1).join(' ');
		const testWidth = ctx.measureText(testLine).width;

		if (testWidth <= boundingWidth) {
			lastValid = mid + 1;
			low = mid + 1;
		} else {
			high = mid;
		}
	}

	return lastValid;
}
