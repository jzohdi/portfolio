import { getFileNameFrom } from "../src/lib/utils/helper";
import { getNotionClient, listAllPostBlocks, listPublishedPostByName, listPublishedPosts } from "../src/lib/notion/vite-build"
import fs from "fs";
import path from "path";



export function saveImages() {
    return {
        name: "saveNotionPostImages",
        buildStart: async () => {
            const apiKey = process.env.NOTION_API_KEY;
            if (!apiKey) {
                throw new Error("missing api key during vite build")
            }
            const client = getNotionClient(apiKey);
            const posts = await listPublishedPosts(client);
            for (const post of posts) {
                const name = post.properties.Name.title[0].plain_text;
                const postDetails = await listPublishedPostByName(client, name);
                if (postDetails.length !== 1) {
                    console.error("post details is not of length 1 for name:", name)
                    continue;
                }
                const allBlocks = await listAllPostBlocks(client, postDetails[0].id);
                for (const block of allBlocks) {
                    if (block.type === "image" && block.image?.file.url) {
                        await fetchAndWriteFile(block.image?.file.url)
                    }
                }
            }
        }
    }
}

async function fetchAndWriteFile(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = getFileNameFrom(url);
        if (fileName === null) {
            return;
        }
        const filePath = path.join(__dirname, "../", 'static', 'posts', fileName);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
        fs.writeFileSync(filePath, buffer);
        console.log('Image downloaded successfully.');
      } catch (error) {
        console.error('Error downloading image:', error);
      }
}