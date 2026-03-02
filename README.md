# AIPER — Static one-page site

Premium static one-page website for **AIPER** at [www.aiper.space](https://www.aiper.space). GitLab Pages–ready.

## Structure

```
/public
  index.html      # Single-page content
  styles.css      # Vanilla CSS (no frameworks)
  main.js         # Minimal JS (nav, smooth scroll, lazy-load)
  assets/         # Images (placeholders; add hero, icons, logos as needed)
```

## Local preview

From the project root:

**Option 1 — Python 3**
```bash
cd public
python -m http.server 8000
```
Then open: http://localhost:8000

**Option 2 — Node (npx)**
```bash
cd public
npx serve -p 8000
```
Then open: http://localhost:8000

**Option 3 — PHP**
```bash
cd public
php -S localhost:8000
```
Then open: http://localhost:8000

## GitLab Pages

- Put the contents of `/public` in the repository root, or configure the Pages source to the `public` directory.
- Ensure `index.html` is at the site root so `https://www.aiper.space/` serves correctly.

## Tech

- Semantic HTML5, vanilla CSS, minimal vanilla JS
- Sticky header, smooth anchor scrolling, mobile nav toggle, FAQ with `<details>`/`<summary>`
- System fonts, no heavy libraries, lazy-load for non-hero images
- Accessibility: skip link, focus-visible, keyboard nav, contrast-safe colors
- SEO: title, meta description, canonical, Open Graph, Twitter cards, JSON-LD Organization
