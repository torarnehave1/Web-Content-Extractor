# Quick Start Guide

Get up and running with Web Content Extractor in 5 minutes!

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)

## Installation & Running

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd Web-Content-Extractor
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### 2b. Start Pages Functions (local API)

```bash
npx wrangler pages dev . --port 8788
```

This serves the API at `http://localhost:8788/api/extract-content`.

### 3. Try It Out!

1. Enter a URL (try: `https://behindeverytemple.org/dharma-blog/dharmic-influencers-to-follow-in-2024/`)
2. Click "Extract Content"
3. View the markdown result
4. Copy or download the content

Tip: If a site blocks server-side fetching, switch to "Paste HTML" mode and paste the page HTML.

That's it! 🎉

## Common Issues

**Port 3000 already in use?**
```bash
# Edit vite.config.js to change the port
```

**Installation fails?**
```bash
# Clear cache and try again
npm cache clean --force
npm install
```

## Next Steps

- Read [README.md](./README.md) for full documentation
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy to Cloudflare
- See [EXAMPLE_OUTPUT.md](./EXAMPLE_OUTPUT.md) for sample output

## Production Build

```bash
npm run build
npm run preview
```

## Deploy to Cloudflare Pages

```bash
npm run build
npx wrangler login
npx wrangler pages deploy dist --project-name=web-content-extractor
```

Cloudflare Pages settings (Git integration):

- Build command: `npm run build`
- Output directory: `dist`
- Functions directory: `functions`
- Node version: 18+

## Need Help?

- Check the full [README.md](./README.md)
- Open an issue on GitHub
- Read the [CONTRIBUTING.md](./CONTRIBUTING.md) guide

---

Happy extracting! Remember to always use this tool ethically and attribute sources properly.
