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

## Supabase auth setup

This repo now includes login/register + a protected dashboard page:

- `login.html` (sign in + register)
- `dashboard.html` (protected page after login)
- `supabase-config.js` (project URL + anon key placeholders)
- `auth.js` (shared auth/session logic)
- `supabase-setup.sql` (profiles table + RLS policies)

### 1) Configure Supabase keys

Edit `supabase-config.js` and replace:

- `url`
- `anonKey`

with your project values from Supabase **Project Settings -> API**.

### 2) Create database table/policies

Run `supabase-setup.sql` in the Supabase SQL editor.

### 3) Auth settings

In Supabase **Authentication -> URL Configuration**, add your site URL(s), e.g.:

- `http://localhost:8000`
- your production domain

### 4) Test flow

1. Open `/login.html`
2. Register user
3. Verify email via the link sent by Supabase
4. Sign in
5. Confirm redirect to `/dashboard.html`
6. Click **Log out** and verify redirect back to `/login.html`

### Email verification

- Registration sends a verification link with redirect target `.../login.html`.
- Login shows a clear message if email is not yet confirmed.
- `login.html` includes a **Resend verification email** button (uses entered login email).

If you use a custom domain in production, set `siteUrl` in `supabase-config.js` so verification emails redirect correctly.
