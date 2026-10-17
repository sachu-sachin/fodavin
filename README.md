# Fodavin Technologies

Official Website Codebase.
## Editing notes

- Pages are plain HTML: each URL is a folder with an `index.html` (for example `/services/seo/` is `services/seo/index.html`). Edit them directly.
- `_redirects` and `_headers` are for Cloudflare Pages: permanent 301 redirects for old URLs, and long cache lifetimes for `/assets/*`. GitHub Pages ignores them.
- CSS and JS links end in `?v=20261017`. After changing a CSS or JS file, change that number on every page (search and replace) so returning visitors download the new file.
- Images and fonts are cached for a year on Cloudflare. To replace one, upload it under a new file name and update the pages that use it.
- `_drafts/` holds unfinished blog posts. It is not linked and not indexed.
- When adding a page, also add it to `sitemap.xml`.
