# AIPER – From Paperwork to Liftoff

Landing page for **AIPER**: AI-powered ECSS-compliant documentation and traceability for satellite manufacturers.

## Stack

- **React 18** + **Vite**
- **Tailwind CSS**
- **Framer Motion** (animations)

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

Output is in `dist/`. To deploy to GitHub Pages, set **Source** to deploy from the `dist` folder, or use a GitHub Action to build and push the contents of `dist` to a `gh-pages` branch / root.

## Project structure

```
├── index.html          # Vite entry
├── src/
│   ├── main.jsx
│   ├── App.jsx         # All sections: Hero, Problem, Solution, How it works, Social proof, Vision, CTA, Footer
│   ├── index.css       # Tailwind + base styles
│   └── components/
│       └── Starfield.jsx   # Canvas starfield + orbital lines (hero)
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## Custom domain (e.g. www.aiper.space)

Keep the `CNAME` file in the repo root. If you deploy from `dist/`, configure your deploy step to copy `CNAME` into `dist/` before publishing.
