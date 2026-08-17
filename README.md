# EDUCE by AIX Content Hub

This is the permanent source for the EDUCE/AIX blog. Netlify builds the public site from the Markdown files in `content/posts`.

## Publish a new article

1. Copy `content/post-template.md` into `content/posts`.
2. Rename it using the article slug, such as `missed-calls-cost-small-business-money.md`.
3. Complete the frontmatter and article body.
4. Run `npm run check` to catch duplicate topics, slugs, titles, and invalid metadata.
5. Commit the file to the publishing branch.
6. Netlify runs `npm run build` and publishes the updated blog, sitemap, RSS feed, SEO metadata, and `deploy-manifest.json`.

## Local check

Run `npm run build`. The deployable website is created in `dist`.

## Netlify settings

- Build command: `npm run build`
- Publish directory: `dist`
- Production branch: `main`
- Recommended domain: `blog.aix-io.com`

## Publishing safety

Start with draft pull requests. Merge only after checking the title, links, CTA, canonical URL, and article preview. Once the workflow is stable, scheduled publishing can create and merge approved content automatically.

## IndexNow

Place the existing IndexNow verification text file inside `public` before launch. Its filename and contents must match the key registered with IndexNow.
