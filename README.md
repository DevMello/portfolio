# Pranav Yerramaneni

Personal site for devmello.xyz: one page, hand-built, no framework and no build step.

- `index.html` - the page: hero with a live reaction-wheel pendulum, work, projects, contact, and a Human/LLM switch
- `styles.css` - design tokens (OKLCH, light and dark), layout, components, print
- `script.js` - nav section marker, the Human/LLM switch, and the pendulum simulation
- `videos/` - two project videos (H.264 MP4) with WebP poster frames
- `ai/index.html` - the same content as plain HTML for AI agents, at `/ai`
- `llms.txt`, `llms-full.txt` - the llms.txt index and the full text as Markdown
- `robots.txt` - allows crawling and points at the files above
- `vercel.json` - on Vercel, serves `llms-full.txt` to requests that accept `text/markdown`, and sets content types
- `PRODUCT.md`, `DESIGN.md` - the design brief the page was built against

Open `index.html` directly, or serve the folder with any static server:

    python -m http.server 8766

Fonts (Atkinson Hyperlegible Next and Mono) load from Google Fonts; everything else is local.
