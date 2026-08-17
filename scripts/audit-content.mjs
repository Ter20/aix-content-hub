import path from "node:path";
import { loadAndAuditPosts } from "./content-audit.mjs";

const contentDir = path.join(process.cwd(), "content", "posts");
const { posts, warnings } = loadAndAuditPosts(contentDir);
for (const warning of warnings) console.warn(`WARNING: ${warning}`);
console.log(`Content audit passed for ${posts.length} post(s).`);
