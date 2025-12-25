# Web Content Extractor

An ethical web content extraction tool that fetches public web articles, converts them to markdown with proper attribution, and allows users to reference and work with content responsibly.

## Features

- **URL Extraction**: Fetch any public web article by URL
- **HTML to Markdown Conversion**: Clean conversion with support for:
  - Headers (h1-h6)
  - Bold/italic text
  - Links and images
  - Lists (ordered and unordered)
  - Blockquotes
  - Code blocks
- **Automatic Attribution**: Every extraction includes:
  - Article title
  - Author name
  - Publication date
  - Source URL
  - Ethical use disclaimer
- **Preview Mode**: Toggle between rendered markdown and raw markdown
- **Export Options**: Copy to clipboard or download as .md file
- **Clean UI**: Modern, responsive design with accessibility features

## Tech Stack

- **Frontend**: Vue.js 3 (Options API)
- **Backend**: Cloudflare Workers (vanilla JavaScript)
- **Database**: Cloudflare D1 (optional, for storing history)
- **Styling**: Regular CSS (no frameworks)
- **Build Tool**: Vite

## Project Structure

```
web-content-extractor/
├── functions/
│   └── api/
│       └── extract-content.js    # Cloudflare Worker endpoint
├── src/
│   ├── components/
│   │   └── ContentExtractor.vue  # Main Vue component
│   ├── App.vue                   # Root component
│   └── main.js                   # Entry point
├── public/                       # Static assets
├── index.html                    # HTML template
├── package.json                  # Dependencies
├── vite.config.js               # Vite configuration
├── wrangler.toml                # Cloudflare configuration
└── schema.sql                   # D1 database schema (optional)
```

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Cloudflare account (for deployment)
- Wrangler CLI (for Cloudflare deployment)

### Local Development Setup

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd Web-Content-Extractor
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

4. **Start the Cloudflare Worker locally (in a separate terminal)**

```bash
npx wrangler pages dev dist --port 8787
```

For local development, you can also test the worker endpoint directly:

```bash
cd functions
npx wrangler dev
```

## Cloudflare Pages Deployment

### Step 1: Build the Application

```bash
npm run build
```

This creates a `dist/` directory with the production build.

### Step 2: Deploy to Cloudflare Pages

#### Option A: Using Wrangler CLI

1. **Login to Cloudflare**

```bash
npx wrangler login
```

2. **Deploy to Pages**

```bash
npx wrangler pages deploy dist --project-name=web-content-extractor
```

#### Option B: Using Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** > **Create a project**
3. Connect your Git repository or upload the `dist` folder directly
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
5. Click **Save and Deploy**

### Step 3: Configure Environment (Optional)

If you want to use D1 database for storing extraction history:

1. **Create a D1 database**

```bash
npx wrangler d1 create content-extractor
```

2. **Copy the database ID** from the output

3. **Update wrangler.toml**

Uncomment and update the D1 configuration:

```toml
[[d1_databases]]
binding = "DB"
database_name = "content-extractor"
database_id = "your-database-id-here"
```

4. **Initialize the database schema**

```bash
npx wrangler d1 execute content-extractor --file=./schema.sql
```

5. **Update the Worker code**

In `functions/api/extract-content.js`, uncomment the database code:

```javascript
// Uncomment this to save to D1
if (env.DB) {
  await saveToDatabase(env.DB, extracted);
}
```

6. **Redeploy**

```bash
npm run build
npx wrangler pages deploy dist
```

## Usage

### Basic Usage

1. **Enter a URL**: Paste any public web article URL into the input field
2. **Extract**: Click "Extract Content" or press Enter
3. **View Results**: The extracted content appears with metadata and attribution
4. **Preview/Raw Toggle**: Switch between rendered markdown and raw markdown
5. **Copy**: Click "Copy Markdown" to copy to clipboard
6. **Download**: Click "Download .md" to save as a markdown file

### Example URLs to Test

- Blog articles
- News articles
- Technical documentation
- Wikipedia pages
- Medium articles

### Ethical Guidelines

This tool is designed for:
- **Educational purposes**: Learning and research
- **Reference and citation**: Properly attributed content for academic work
- **Collaborative work**: Sharing content with proper source attribution
- **Personal archiving**: Saving articles for personal reference

This tool should NOT be used for:
- Content theft or plagiarism
- Republishing without permission
- Removing attribution
- Commercial redistribution without proper licensing

## API Reference

### POST /api/extract-content

Extracts content from a given URL and converts it to markdown.

**Request Body:**

```json
{
  "url": "https://example.com/article"
}
```

**Response:**

```json
{
  "success": true,
  "url": "https://example.com/article",
  "title": "Article Title",
  "author": "Author Name",
  "date": "2024-01-15T00:00:00.000Z",
  "markdown": "# Article Title\n\n...",
  "extractedAt": "2024-01-15T12:00:00.000Z"
}
```

**Error Response:**

```json
{
  "error": "Failed to fetch: 404 Not Found"
}
```

## Development

### Project Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run deploy   # Deploy to Cloudflare Pages
```

### Code Structure

#### Cloudflare Worker (`functions/api/extract-content.js`)

Key functions:
- `onRequestPost()`: Main handler for POST requests
- `extractContent()`: Orchestrates the extraction process
- `extractMetadata()`: Extracts title, author, date from HTML
- `findMainContent()`: Identifies main article content
- `htmlToMarkdown()`: Converts HTML elements to markdown
- `buildMarkdownWithAttribution()`: Adds source attribution
- `decodeHtmlEntities()`: Decodes HTML entities
- `saveToDatabase()`: Optional D1 database storage

#### Vue Component (`src/components/ContentExtractor.vue`)

Key methods:
- `extractContent()`: Calls the API endpoint
- `copyMarkdown()`: Copies markdown to clipboard
- `downloadMarkdown()`: Downloads as .md file
- `markdownToHtml()`: Renders markdown preview
- `sanitizeFilename()`: Cleans filename for downloads

## Customization

### Styling

All styles are in the `<style scoped>` section of `ContentExtractor.vue`. Customize colors, fonts, and layout to match your preferences.

### Extraction Logic

Modify `functions/api/extract-content.js` to:
- Add support for more HTML elements
- Improve content detection for specific websites
- Add custom metadata extraction
- Implement rate limiting or caching

### UI Features

Add new features to `ContentExtractor.vue`:
- Save to local storage
- History of extractions
- Batch URL processing
- Custom markdown formatting options

## Troubleshooting

### CORS Issues

If you encounter CORS errors during local development:

1. Make sure the Cloudflare Worker is running on port 8787
2. Check that the Vite proxy is configured correctly in `vite.config.js`
3. For production, CORS headers are already configured in the Worker

### Extraction Failures

If extraction fails for certain websites:

1. Check if the website blocks automated access (robots.txt)
2. Some websites use heavy JavaScript - this tool works best with static HTML
3. Try adjusting the content detection patterns in `findMainContent()`

### Build Errors

If you encounter build errors:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## Expected Output Example

When extracting the example URL (https://behindeverytemple.org/dharma-blog/dharmic-influencers-to-follow-in-2024/), you should see:

```markdown
# Dharmic Influencers to Follow in 2024

---

**Author:** Behind Every Temple
**Published:** January 15, 2024
**Source:** https://behindeverytemple.org/dharma-blog/...

---

[Main article content converted to markdown...]

---

## Ethical Use Notice

This content was extracted for educational and reference purposes. All rights belong to the original author and publisher. Please respect copyright and always attribute the source when using this content.

**Original Source:** https://behindeverytemple.org/dharma-blog/...
**Extracted:** December 25, 2024, 12:00:00 PM
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Ethical Considerations

This tool is built with ethical use in mind:

- **Always attributes sources**: Every extraction includes full attribution
- **Disclaimers included**: Automatic ethical use notices
- **Respects robots.txt**: Use responsibly and respect website policies
- **No content theft**: Designed for reference, not republishing
- **Educational purpose**: For learning and collaborative work

Please use this tool responsibly and always respect copyright laws and website terms of service.

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review Cloudflare Pages and Workers documentation

## Acknowledgments

Built with:
- Vue.js - Progressive JavaScript framework
- Cloudflare Workers - Serverless compute platform
- Vite - Next-generation frontend tooling

---

**Remember**: Always use this tool ethically and respect content creators' rights!
