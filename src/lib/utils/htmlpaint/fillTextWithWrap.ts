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
	const lines = getWrappedLines(ctx, node.textContent, details.boundingWidth + 10);

	lines.forEach((line, index) => {
		ctx.fillText(line, details.x, details.y + index * details.fontSize);
	});
}

// function getWrappedLines(
// 	ctx: CanvasRenderingContext2D,
// 	text: string,
// 	boundingWidth: number
//   ): string[] {
// 	const lines: string[] = [];
// 	const words = text.split(' ');
// 	let currentLine = '';
// 	for (const word of words) {
// 	  const testLine = currentLine ? `${currentLine} ${word}` : word;
// 	  const testWidth = ctx.measureText(testLine).width;
	
// 	  if (testWidth <= boundingWidth) {
// 		currentLine = testLine;
// 	  } else {
// 		if (currentLine) {
// 		  lines.push(currentLine);
// 		}
// 		currentLine = word;
// 	  }
// 	}
  
// 	if (currentLine) {
// 	  lines.push(currentLine);
// 	}
  
// 	return lines;
//   }

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

		if (testWidth <= boundingWidth + 10) {
			lastValid = mid + 1;
			low = mid + 1;
		} else {
			high = mid;
		}
	}
	if (lastValid === 0) {
		console.error("this should not happen")
		throw new Error("infinite loop avoided, cannot render resume")
	}
	return lastValid;
}
