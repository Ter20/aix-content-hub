import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content", "posts");
const publicDir = path.join(root, "public");
const outDir = path.join(root, "dist");
const site = {
  name: "EDUCE by AIX",
  url: "https://blog.aix-io.com",
  description: "Plain-English AI education for small-business owners. Learn what works, what does not, and how to use AI responsibly.",
  author: "Terrence Applewhite"
};

function escapeHtml(value = "") {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function inline(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function markdown(value) {
  const lines = value.trim().split(/\r?\n/);
  let html = "";
  let list = null;
  const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { closeList(); continue; }
    if (line.startsWith("### ")) { closeList(); html += `<h3>${inline(line.slice(4))}</h3>`; continue; }
    if (line.startsWith("## ")) { closeList(); html += `<h2>${inline(line.slice(3))}</h2>`; continue; }
    if (line.startsWith("# ")) { continue; }
    if (line.startsWith("> ")) { closeList(); html += `<blockquote>${inline(line.slice(2))}</blockquote>`; continue; }
    const bullet = line.match(/^[-*] (.+)$/);
    if (bullet) { if (list !== "ul") { closeList(); list = "ul"; html += "<ul>"; } html += `<li>${inline(bullet[1])}</li>`; continue; }
    const numbered = line.match(/^\d+\. (.+)$/);
    if (numbered) { if (list !== "ol") { closeList(); list = "ol"; html += "<ol>"; } html += `<li>${inline(numbered[1])}</li>`; continue; }
    closeList(); html += `<p>${inline(line)}</p>`;
  }
  closeList();
  return html;
}

function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("Post is missing frontmatter");
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

function layout({ title, description, canonical, body, type = "website", schema = null }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="author" content="${site.author}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="${type}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:site_name" content="${site.name}"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/styles.css">${schema ? `<script type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script>` : ""}</head><body><header class="site-header"><nav class="nav" aria-label="Primary"><a class="brand" href="/"><span>EDUCE</span> by AIX</a><div class="nav-links"><a href="/blog/">Articles</a><a href="https://aix-io.com">AIX Services</a><a href="https://aix-io.com/book-demo">Book a Demo</a></div></nav></header>${body}<footer class="footer"><p>© 2026 AIX Artificial Intelligence Xtreme · Founded by Terrence Applewhite · Dallas, Texas</p><p>Learn clearly. Automate responsibly. Leave no lead behind.</p></footer></body></html>`;
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.cpSync(publicDir, outDir, { recursive: true });

const posts = fs.readdirSync(contentDir).filter(file => file.endsWith(".md")).map(file => {
  const source = fs.readFileSync(path.join(contentDir, file), "utf8");
  const post = parseFrontmatter(source);
  if (!post.data.title || !post.data.description || !post.data.date || !post.data.slug) throw new Error(`${file} is missing required frontmatter`);
  return { ...post.data, body: post.body, file };
}).filter(post => !post.draft).sort((a, b) => b.date.localeCompare(a.date));

const cards = posts.map(post => `<article class="post-card"><span class="tag">${escapeHtml(post.tags?.[0] || "AI Education")}</span><h3><a href="/blog/${post.slug}/">${escapeHtml(post.title)}</a></h3><p>${escapeHtml(post.description)}</p><p class="meta">${new Date(`${post.date}T12:00:00`).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })} · ${escapeHtml(post.author)}</p></article>`).join("");

const homeBody = `<section class="hero"><div class="hero-inner"><p class="eyebrow">Plain-English AI for business owners</p><h1>Learn the technology. Keep the human judgment.</h1><p>EDUCE breaks down AI, automation, lead capture, reviews, and growth without the jargon. Clear lessons you can use in a real business.</p><a class="button" href="/blog/">Start learning</a></div></section><section class="section"><div class="section-head"><div><p class="eyebrow">Latest lessons</p><h2>Build smarter. Miss less.</h2></div><a href="/blog/">View all articles →</a></div><div class="post-grid">${cards || '<div class="empty">The first article is being prepared.</div>'}</div></section>`;
fs.writeFileSync(path.join(outDir, "index.html"), layout({ title:`${site.name} — Learn AI for Your Business`, description:site.description, canonical:`${site.url}/`, body:homeBody, schema:{"@context":"https://schema.org","@type":"EducationalOrganization","name":site.name,"url":site.url,"founder":{"@type":"Person","name":site.author}} }));

fs.mkdirSync(path.join(outDir, "blog"), { recursive: true });
const blogBody = `<section class="article-hero"><div><p class="eyebrow">EDUCE AI Education Blog</p><h1>Practical AI, explained like a human.</h1><p>Guides for business owners who want useful answers—not a dictionary full of robot soup.</p></div></section><section class="section"><div class="post-grid">${cards}</div></section>`;
fs.writeFileSync(path.join(outDir, "blog", "index.html"), layout({ title:`Blog | ${site.name}`, description:site.description, canonical:`${site.url}/blog/`, body:blogBody }));

for (const post of posts) {
  const dir = path.join(outDir, "blog", post.slug);
  fs.mkdirSync(dir, { recursive: true });
  const articleUrl = `${site.url}/blog/${post.slug}/`;
  const body = `<section class="article-hero"><div><p class="eyebrow">${escapeHtml(post.tags?.join(" · ") || "AI Education")}</p><h1>${escapeHtml(post.title)}</h1><p>${escapeHtml(post.description)}</p></div></section><article class="article"><p class="byline">By ${escapeHtml(post.author)} · ${new Date(`${post.date}T12:00:00`).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}</p>${markdown(post.body)}</article>`;
  const schema = {"@context":"https://schema.org","@type":"Article","headline":post.title,"description":post.description,"datePublished":post.date,"dateModified":post.updated || post.date,"author":{"@type":"Person","name":post.author},"publisher":{"@type":"Organization","name":"AIX Artificial Intelligence Xtreme"},"mainEntityOfPage":articleUrl};
  fs.writeFileSync(path.join(dir, "index.html"), layout({ title:`${post.title} | ${site.name}`, description:post.description, canonical:articleUrl, body, type:"article", schema }));
}

const urls = [`${site.url}/`, `${site.url}/blog/`, ...posts.map(post => `${site.url}/blog/${post.slug}/`)];
fs.writeFileSync(path.join(outDir, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url, i) => `  <url><loc>${url}</loc><changefreq>${i < 2 ? "weekly" : "monthly"}</changefreq><priority>${i === 0 ? "1.0" : i === 1 ? "0.9" : "0.8"}</priority></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync(path.join(outDir, "feed.xml"), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${site.name}</title><link>${site.url}</link><description>${site.description}</description>${posts.map(post => `<item><title>${escapeHtml(post.title)}</title><link>${site.url}/blog/${post.slug}/</link><guid>${site.url}/blog/${post.slug}/</guid><pubDate>${new Date(`${post.date}T12:00:00Z`).toUTCString()}</pubDate><description>${escapeHtml(post.description)}</description></item>`).join("")}</channel></rss>`);

console.log(`Built ${posts.length} published post(s) into dist/`);
