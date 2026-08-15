# Blog Automation Contract

Future publishing automations should follow these rules.

## Required output

- Create one new Markdown file inside `content/posts`.
- Start from `content/post-template.md`.
- Use a unique search-focused slug.
- Set `draft: true` while the article awaits review.
- Use Terrence Applewhite as author.
- Use one primary CTA throughout the article.
- Never reuse an existing article's title, slug, or search intent.
- Do not publish the same article to another AIX subdomain.

## Approval workflow

1. Generate the article and run `npm run build`.
2. Check that the build succeeds.
3. Open a draft pull request containing the article.
4. Review the headline, factual claims, links, CTA, canonical URL, and preview.
5. Change `draft` to `false` and merge after approval.
6. Netlify publishes the new version automatically.

## Channel roles

- `blog.aix-io.com`: EDUCE education and searchable AI guides.
- `lab.aix-io.com`: original experiments, measurements, and case studies.
- `app.aix-io.com`: product experience and documentation.
- `automation.aix-io.com`: AIX service and conversion pages.

Do not duplicate articles between these properties. Link related pages together instead.
