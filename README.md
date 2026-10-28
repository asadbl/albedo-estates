# Albedo Estates

A light-theme landing page for a Mallorca real estate agency: a scroll-driven film through a featured villa, filterable listings, an interactive 3D model, services, areas, FAQ and an enquiry form.

All names, homes, prices and contact details are placeholders, and the images, film and 3D model are AI-generated and illustrative.

```sh
npm install
npm run dev      # local dev server
npm run deploy   # build and publish to GitHub Pages (gh-pages branch)
```

- `scenes/` holds the three film shots; `python3 tools/build_frames.py` turns them into `public/frames/`.
- `src/walk-config.js` sets the film's chapters, labels and timing.
