import { getFileNameFrom } from '../src/lib/utils/vite-helper';
import {
	getNotionClient,
	listAllPostBlocks,
	listPublishedPostByName,
	listPublishedPosts
} from '../src/lib/notion/vite-build';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
// import sharp from "sharp";

export function saveImages() {
	return {
		name: 'saveNotionPostImages',
		buildStart: async () => {
			if (process.env.NODE_ENV === 'development') {
				return;
			}
			const apiKey = process.env.NOTION_API_KEY;
			if (!apiKey) {
				throw new Error('missing api key during vite build');
			}
			const client = getNotionClient(apiKey);
			const posts = await listPublishedPosts(client);
			const urlsToSave: string[] = [];
			for (const post of posts) {
				const name = post.properties.Name.title[0].plain_text;
				const postDetails = await listPublishedPostByName(client, name);
				if (postDetails.length !== 1) {
					console.error('post details is not of length 1 for name:', name);
					continue;
				}
				const postToDownload = postDetails[0];
				const thumbnailUrl = postToDownload.properties.thumbnail.files[0].file.url;
				// await fetchAndWriteFile(thumbnailUrl);
				urlsToSave.push(thumbnailUrl);
				const allBlocks = await listAllPostBlocks(client, postToDownload.id);
				for (const block of allBlocks) {
					if (block.type === 'image' && block.image?.file.url) {
						// await fetchAndWriteFile(block.image?.file.url)
						urlsToSave.push(block.image?.file.url);
					}
				}
			}
			await Promise.all(urlsToSave.map(fetchAndWriteFile));
		}
	};
}

async function fetchAndWriteFile(url: string) {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.statusText}`);
		}
		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const compressedBuffer = await resizeToTargetSize(buffer, 200);
		const fileName = getFileNameFrom(url);
		if (fileName === null) {
			return;
		}
		const filePath = path.join(__dirname, '../', 'static', 'posts', fileName);
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(filePath, compressedBuffer);
		console.log('Image downloaded successfully.');
	} catch (error) {
		console.error('Error downloading image:', error);
	}
}

async function resizeToTargetSize(buffer: Buffer, targetSizeKB: number): Promise<Buffer> {
	const targetSizeBytes = targetSizeKB * 1024;
	if (buffer.length < targetSizeBytes) {
		return buffer;
	}

	return compress(buffer, targetSizeBytes);
}

async function compress(buffer: Buffer, targetSizeBytes: number): Promise<Buffer> {
	const quality = 85; // Starting quality
	let width = null; // Starting width (null means original width)
	let height = null; // Starting height (null means original height)
	try {
		let sharpBuffer = await sharp(buffer).resize(width, height).jpeg({ quality }).toBuffer();
		while (sharpBuffer.length > targetSizeBytes && quality > 10) {
			// Adjust quality

			// Resize image with the current quality
			sharpBuffer = await sharp(buffer).resize(width, height).jpeg({ quality }).toBuffer();

			// If the buffer is still too large, reduce dimensions
			if (sharpBuffer.length > targetSizeBytes) {
				const metadata = await sharp(sharpBuffer).metadata();
                if (!metadata || !metadata.width || !metadata.height) {
                    console.error("Something went wrong resizing, returning original")
                    return buffer;
                }
				width = Math.floor(metadata.width * 0.9); // Reduce width by 10%
				height = Math.floor(metadata.height * 0.9); // Reduce height by 10%
			}
		}

		console.log(`Image resized to ${sharpBuffer.length / 1024} KB`);
		return sharpBuffer;
		// Save the processed image
	} catch (error) {
		console.error('Error processing image:', error);
	}
	return buffer;
}

// const filePath = path.join(__dirname, '../', 'static', 'images', "pink_wig.png");
// const outputPath = path.join(__dirname, '../', 'static', 'images', "compressed_pink_wig.jpeg");
// await resizePathToTarget(filePath, outputPath, 200)
// async function resizePathToTarget(inputPath: string, outputPath:string, targetSizeKB: number) {
//     try {
//       const targetSizeBytes = targetSizeKB * 1024;
//       let quality = 80; // Starting quality
//       let width = null; // Starting width (null means original width)
//       let height = null; // Starting height (null means original height)
//       let buffer = await sharp(inputPath).toBuffer();
  
//       while (buffer.length > targetSizeBytes) {
//         // Adjust quality
//         // quality -= 10;
  
//         // Resize image with the current quality
//         buffer = await sharp(inputPath)
//           .resize(width, height)
//           .jpeg({ quality })
//           .toBuffer();
  
//         // If the buffer is still too large, reduce dimensions
//         if (buffer.length > targetSizeBytes) {
//           const metadata = await sharp(buffer).metadata();
//           if (!metadata || !metadata.width || !metadata.height) {
//             throw new Error("lol")
//           }
//           width = Math.floor(metadata.width * 0.9); // Reduce width by 10%
//           height = Math.floor(metadata.height * 0.9); // Reduce height by 10%
//         }
//       }
  
//       // Save the processed image
//       await sharp(buffer).jpeg().toFile(outputPath);
//       console.log(`Image resized to ${buffer.length / 1024} KB and saved to ${outputPath}`);
//     } catch (error) {
//       console.error('Error processing image:', error);
//     }
//   }