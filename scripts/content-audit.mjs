import fs from "node:fs";
import path from "node:path";

const REQUIRED = ["title", "description", "date", "author", "slug", "primaryKeyword", "searchIntent", "draft"];

export function parseFrontmatter(source, file = "post") {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${file} is missing frontmatter`);
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (!pair) continue;
    let value = pair[2].trim();
    if (value.startsWith("[") && value.endsWith("]")) value = value.slice(1, -1).split(",").map(x => x.trim().replace(/^['"]|['"]$/g, ""));
    else if (value === "true" || value === "false") value = value === "true";
    else value = value.replace(/^['"]|['"]$/g, "");
    data[pair[1]] = value;
  }
  return { data, body: match[2] };
}

function normalized(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function wordSet(value) {
  return new Set(normalized(value).split(" ").filter(word => word.length > 2));
}

function overlap(a, b) {
  const left = wordSet(a);
  const right = wordSet(b);
  if (!left.size || !right.size) return 0;
  const shared = [...left].filter(word => right.has(word)).length;
  return shared / Math.min(left.size, right.size);
}

export function loadAndAuditPosts(contentDir) {
  const errors = [];
  const warnings = [];
  const posts = fs.readdirSync(contentDir).filter(file => file.endsWith(".md")).map(file => {
    const { data, body } = parseFrontmatter(fs.readFileSync(path.join(contentDir, file), "utf8"), file);
    for (const field of REQUIRED) if (data[field] === undefined || data[field] === "") errors.push(`${file}: missing ${field}`);
    if (data.slug && path.basename(file, ".md") !== data.slug) errors.push(`${file}: filename must match slug "${data.slug}"`);
    if (data.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) errors.push(`${file}: slug must use lowercase words separated by hyphens`);
    if (data.description && data.description.length > 160) errors.push(`${file}: description is ${data.description.length} characters (maximum 160)`);
    if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) errors.push(`${file}: date must be YYYY-MM-DD`);
    return { ...data, body, file };
  });

  for (let i = 0; i < posts.length; i++) {
    for (let j = i + 1; j < posts.length; j++) {
      const a = posts[i];
      const b = posts[j];
      if (normalized(a.slug) === normalized(b.slug)) errors.push(`${a.file} and ${b.file}: duplicate slug`);
      if (normalized(a.title) === normalized(b.title)) errors.push(`${a.file} and ${b.file}: duplicate title`);
      if (normalized(a.primaryKeyword) === normalized(b.primaryKeyword)) errors.push(`${a.file} and ${b.file}: duplicate primaryKeyword "${a.primaryKeyword}"`);
      if (normalized(a.searchIntent) === normalized(b.searchIntent)) errors.push(`${a.file} and ${b.file}: duplicate searchIntent; assign one page as the topic owner`);
      const similarity = overlap(`${a.title} ${a.primaryKeyword}`, `${b.title} ${b.primaryKeyword}`);
      if (similarity >= 0.75) warnings.push(`${a.file} and ${b.file}: ${Math.round(similarity * 100)}% topic overlap; review for keyword cannibalization`);
    }
  }

  if (errors.length) throw new Error(`Content audit failed:\n- ${errors.join("\n- ")}`);
  return { posts, warnings };
}
