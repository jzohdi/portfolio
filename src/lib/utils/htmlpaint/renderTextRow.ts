import { flatMapOfText } from './htmlpaint';
import type { ElementNode, Word } from './types';

export function renderTextRow(
	ctx: CanvasRenderingContext2D,
	row: ElementNode,
	x: number,
	y: number,
	boundingWidth: number
): void {
	const words: Word[] = flatMapOfText(row);
	ctx.textBaseline = 'top';

	const lines = words.reduce<Word[][]>(
		(acc, word) => processWordIntoLines(ctx, acc, word, boundingWidth),
		[]
	);

	let currentY = y; // Track the current y position
	lines.forEach((line) => {
		renderLine(ctx, line, x, currentY);
		currentY += line[0].styles.fontSize; // Move to the next line based on font size
	});
}
function processWordIntoLines(
	ctx: CanvasRenderingContext2D,
	lines: Word[][],
	word: Word,
	boundingWidth: number
): Word[][] {
	ctx.font = word.styles.font;

	const currentLine = lines[lines.length - 1] || [];
	const testLine = [...currentLine, word];
	const testWidth = measureLineWidth(ctx, testLine);

	if (testWidth > boundingWidth + 5 && currentLine.length > 0) {
		lines.push([word]); // Start a new line
	} else {
		if (!lines.length) lines.push([]); // Ensure at least one line exists
		lines[lines.length - 1].push(word);
	}

	return lines;
}
function measureLineWidth(ctx: CanvasRenderingContext2D, line: Word[]): number {
	return line.reduce((width, word) => {
		return (
			width +
			ctx.measureText(word.word).width +
			(word.hasSpaceAfter ? ctx.measureText(' ').width : 0)
		);
	}, 0);
}
function renderLine(ctx: CanvasRenderingContext2D, line: Word[], x: number, y: number): void {
	let currentX = x;
	line.forEach((word) => {
		ctx.font = word.styles.font;
		ctx.fillStyle = word.styles.fillStyle;
		ctx.fillText(word.word, currentX, y);

		currentX += ctx.measureText(word.word).width;
		if (word.hasSpaceAfter) {
			currentX += ctx.measureText(' ').width;
		}
	});
}
