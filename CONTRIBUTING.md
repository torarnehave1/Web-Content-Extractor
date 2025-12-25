# Contributing to Web Content Extractor

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

### Our Pledge

This project is designed for ethical content extraction with proper attribution. We expect all contributors to:

- Use the tool responsibly and ethically
- Respect copyright and intellectual property rights
- Provide proper attribution for all content
- Follow web scraping best practices
- Be respectful and constructive in all interactions

## How to Contribute

### Reporting Bugs

If you find a bug:

1. **Check existing issues** to avoid duplicates
2. **Create a new issue** with:
   - Clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (browser, OS, Node version)

### Suggesting Features

For new features:

1. **Check existing issues** for similar suggestions
2. **Create a feature request** with:
   - Clear description of the feature
   - Use cases and benefits
   - Potential implementation approach
   - Any relevant examples or mockups

### Pull Requests

#### Before Submitting

1. **Fork the repository**
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following our coding standards
4. **Test thoroughly** in both development and production builds
5. **Update documentation** if needed

#### Coding Standards

**JavaScript/Vue:**
- Use ES6+ syntax
- Follow existing code style (no TypeScript)
- Add comments for complex logic
- Use meaningful variable names
- Keep functions focused and small

**CSS:**
- Use vanilla CSS (no preprocessors or frameworks)
- Follow BEM naming convention where appropriate
- Ensure responsive design
- Test across browsers

**HTML:**
- Semantic HTML5 elements
- Accessibility attributes (ARIA labels, roles)
- Proper meta tags

#### Commit Messages

Follow conventional commits:

```
feat: add markdown table support
fix: correct image extraction regex
docs: update deployment instructions
style: format code with prettier
refactor: simplify HTML parsing logic
test: add unit tests for markdown conversion
```

#### Pull Request Process

1. **Update README.md** with details of changes if needed
2. **Ensure all tests pass** (when tests are added)
3. **Update version numbers** in package.json if applicable
4. **Request review** from maintainers
5. **Address feedback** promptly and professionally

## Development Setup

### Local Environment

```bash
# Clone your fork
git clone https://github.com/yourusername/web-content-extractor.git
cd web-content-extractor

# Install dependencies
npm install

# Start development server
npm run dev

# In another terminal, start the Worker
cd functions
npx wrangler dev
```

### Testing Changes

Before submitting:

1. **Test the URL extraction** with various websites:
   - News articles
   - Blog posts
   - Technical documentation
   - Different HTML structures

2. **Test all features**:
   - URL validation
   - Content extraction
   - Markdown conversion
   - Copy to clipboard
   - Download functionality
   - Preview toggle
   - Responsive design

3. **Check browser compatibility**:
   - Chrome/Edge
   - Firefox
   - Safari
   - Mobile browsers

### Code Quality

Run these before committing:

```bash
# Build to check for errors
npm run build

# Check for console errors
# (Open DevTools in the browser)

# Validate HTML
# (Use W3C validator)
```

## Project Structure

```
web-content-extractor/
├── functions/api/          # Cloudflare Worker
│   └── extract-content.js  # Main extraction logic
├── src/
│   ├── components/         # Vue components
│   │   └── ContentExtractor.vue
│   ├── App.vue            # Root component
│   └── main.js            # Entry point
├── public/                # Static assets
└── index.html             # HTML template
```

## Areas for Contribution

### High Priority

- [ ] Improved content detection for specific websites
- [ ] Better handling of JavaScript-heavy sites
- [ ] Support for more markdown elements (tables, footnotes)
- [ ] Rate limiting for API endpoint
- [ ] Batch URL processing
- [ ] Browser extension version

### Medium Priority

- [ ] Unit tests for extraction functions
- [ ] Integration tests for Vue components
- [ ] Dark mode theme
- [ ] Export to other formats (PDF, DOCX)
- [ ] Custom markdown templates
- [ ] Keyboard shortcuts

### Low Priority

- [ ] i18n (internationalization)
- [ ] User preferences (save settings)
- [ ] Extraction history in localStorage
- [ ] Social sharing features
- [ ] Browser bookmarklet

## Feature Guidelines

When adding features:

1. **Maintain ethical standards**: All features must support proper attribution
2. **Keep it simple**: Don't over-engineer
3. **Stay focused**: Features should relate to content extraction
4. **Accessibility**: All UI changes must be accessible
5. **Performance**: Don't slow down the app significantly

## Documentation

Update documentation for:

- New features (README.md)
- API changes (README.md, code comments)
- Configuration changes (wrangler.toml, package.json)
- Deployment process (DEPLOYMENT.md)
- Examples (EXAMPLE_OUTPUT.md)

## Testing Checklist

Before submitting a PR:

- [ ] Code follows project style
- [ ] Changes are tested locally
- [ ] No console errors or warnings
- [ ] Responsive design works on mobile
- [ ] Accessibility is maintained
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] PR description explains changes

## Questions?

If you have questions:

1. Check existing documentation
2. Search existing issues
3. Create a new issue with the "question" label
4. Be specific about what you need help with

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- README.md contributors section (if we add one)
- Release notes for significant contributions
- Project documentation

## Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort in making Web Content Extractor a useful, ethical tool for content extraction.

---

**Remember**: We're building a tool that respects content creators while making information more accessible. Keep this mission in mind with all contributions.
