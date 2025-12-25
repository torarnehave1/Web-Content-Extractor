# Deployment Guide

This guide walks you through deploying the Web Content Extractor to Cloudflare Pages.

## Prerequisites

- Cloudflare account (free tier works fine)
- Node.js 18+ installed locally
- Wrangler CLI installed (`npm install -g wrangler`)
- Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### Option 1: Automatic GitHub Deployment (Recommended)

1. **Push your code to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/web-content-extractor.git
git push -u origin main
```

2. **Connect to Cloudflare Pages**

- Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
- Navigate to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
- Select your repository
- Configure build settings:
  - **Production branch**: `main`
  - **Build command**: `npm run build`
  - **Build output directory**: `dist`
  - **Root directory**: `/`
  - **Node.js version**: `18` or higher

3. **Deploy**

- Click **Save and Deploy**
- Wait for the build to complete (usually 1-2 minutes)
- Your site will be live at `https://web-content-extractor.pages.dev`

### Option 2: Direct Upload via Wrangler CLI

1. **Build the project**

```bash
npm install
npm run build
```

2. **Login to Cloudflare**

```bash
npx wrangler login
```

3. **Deploy**

```bash
npx wrangler pages deploy dist --project-name=web-content-extractor
```

4. **Access your site**

The CLI will output your site URL: `https://web-content-extractor.pages.dev`

## Optional: D1 Database Setup

If you want to store extraction history:

### 1. Create D1 Database

```bash
npx wrangler d1 create content-extractor
```

Copy the database ID from the output.

### 2. Update wrangler.toml

Edit `wrangler.toml` and uncomment the D1 section:

```toml
[[d1_databases]]
binding = "DB"
database_name = "content-extractor"
database_id = "paste-your-database-id-here"
```

### 3. Initialize Database Schema

```bash
npx wrangler d1 execute content-extractor --file=./schema.sql
```

### 4. Bind Database to Pages Project

In Cloudflare Dashboard:
1. Go to your Pages project
2. Navigate to **Settings** → **Functions** → **D1 database bindings**
3. Add binding:
   - **Variable name**: `DB`
   - **D1 database**: Select `content-extractor`
4. Save

### 5. Update Worker Code

In `functions/api/extract-content.js`, uncomment:

```javascript
if (env.DB) {
  await saveToDatabase(env.DB, extracted);
}
```

### 6. Redeploy

```bash
npm run build
npx wrangler pages deploy dist
```

Or push to GitHub to trigger automatic deployment.

## Custom Domain Setup

### 1. Add Custom Domain

In Cloudflare Dashboard:
1. Go to your Pages project
2. Navigate to **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `extractor.yourdomain.com`)
5. Follow DNS configuration instructions

### 2. SSL Certificate

Cloudflare automatically provisions SSL certificates for your custom domain. This usually takes a few minutes.

## Environment Variables

If you need to add environment variables:

### Via Dashboard:

1. Go to your Pages project
2. Navigate to **Settings** → **Environment variables**
3. Add variables for Production and/or Preview environments

### Via wrangler.toml:

```toml
[vars]
ENVIRONMENT = "production"
API_RATE_LIMIT = "100"
```

## Monitoring and Analytics

### Enable Web Analytics

1. Go to your Pages project
2. Navigate to **Analytics**
3. Enable **Web Analytics**

### View Logs

```bash
npx wrangler pages deployment tail
```

Or view in Dashboard under **Functions** → **Logs**

## Rollback Deployments

If something goes wrong:

1. Go to your Pages project
2. Navigate to **Deployments**
3. Find a previous successful deployment
4. Click **...** → **Rollback to this deployment**

## Performance Optimization

### 1. Enable Cloudflare CDN

Cloudflare automatically caches static assets. To optimize:

- Images are served from CDN
- JavaScript/CSS are minified and cached
- Global edge network ensures fast loading

### 2. Add Cache Headers

In `vite.config.js`, you can configure caching:

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue': ['vue']
        }
      }
    }
  }
});
```

## Troubleshooting

### Build Failures

**Problem**: Build fails with "command not found"

**Solution**: Ensure Node.js version is 18+ in Pages settings

**Problem**: "Module not found" errors

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Runtime Errors

**Problem**: API endpoint returns 404

**Solution**: Ensure `functions/api/extract-content.js` is in the correct directory

**Problem**: CORS errors

**Solution**: Check that CORS headers are set in the Worker (already configured)

### D1 Database Issues

**Problem**: Database binding not working

**Solution**:
1. Verify binding name is `DB`
2. Check database is bound in Pages settings
3. Ensure schema is initialized

## Continuous Deployment

Once connected to GitHub:

1. Every push to `main` triggers a production deployment
2. Pull requests create preview deployments
3. Preview URLs are automatically commented on PRs

## Cost Estimation

### Free Tier Includes:
- 500 builds per month
- Unlimited requests
- Unlimited bandwidth
- 100,000 D1 reads/day
- 1,000 D1 writes/day

### Paid Tier:
- $5/month for Workers Paid plan (if you exceed limits)
- Additional D1 operations charged beyond free tier

For most use cases, the free tier is sufficient.

## Security Best Practices

1. **Rate Limiting**: Consider adding rate limiting to the Worker
2. **Input Validation**: Already implemented in the Worker
3. **CORS**: Configured for all origins (adjust if needed)
4. **Content Security Policy**: Add in index.html if needed

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src * data:; script-src 'self' 'unsafe-inline'">
```

## Next Steps

After deployment:

1. Test the live application thoroughly
2. Set up monitoring and alerts
3. Add custom domain
4. Configure D1 database (optional)
5. Share with users!

## Support

For deployment issues:
- Cloudflare Community: https://community.cloudflare.com/
- Cloudflare Docs: https://developers.cloudflare.com/pages/
- GitHub Issues: (your repo)

---

**Your app should now be live!** Visit your deployment URL and test the content extractor.
