<template>
  <div class="content-extractor">
    <div class="header">
      <h1>Web Content Extractor</h1>
      <p class="subtitle">
        Extract and convert web articles to markdown with proper attribution
      </p>
      <div class="ethical-badge">
        <span class="badge-icon">⚖️</span>
        <span>Ethical Use Tool - Always Attributes Sources</span>
      </div>
    </div>

    <div class="input-section">
      <div class="url-input-wrapper">
        <label for="url-input" class="visually-hidden">Enter article URL</label>
        <input
          id="url-input"
          v-model="url"
          type="url"
          placeholder="https://example.com/article"
          @keyup.enter="extractContent"
          :disabled="loading"
          aria-label="Article URL"
          class="url-input"
        />
        <button
          @click="extractContent"
          :disabled="loading || !url"
          class="extract-button"
          :class="{ loading: loading }"
        >
          <span v-if="loading" class="spinner"></span>
          <span>{{ loading ? 'Extracting...' : 'Extract Content' }}</span>
        </button>
      </div>

      <div v-if="error" class="error-message" role="alert">
        <span class="error-icon">⚠️</span>
        <span>{{ error }}</span>
      </div>

      <div class="examples">
        <p class="examples-label">Try these examples:</p>
        <button
          v-for="example in exampleUrls"
          :key="example.url"
          @click="loadExample(example.url)"
          class="example-link"
          :disabled="loading"
        >
          {{ example.label }}
        </button>
      </div>
    </div>

    <div v-if="result" class="result-section">
      <div class="metadata">
        <h2 class="article-title">{{ result.title || 'Extracted Content' }}</h2>
        <div class="metadata-items">
          <div v-if="result.author" class="metadata-item">
            <strong>Author:</strong> {{ result.author }}
          </div>
          <div v-if="result.date" class="metadata-item">
            <strong>Published:</strong> {{ formatDate(result.date) }}
          </div>
          <div class="metadata-item">
            <strong>Source:</strong>
            <a :href="result.url" target="_blank" rel="noopener noreferrer">
              {{ result.url }}
            </a>
          </div>
        </div>
      </div>

      <div class="actions-bar">
        <button
          @click="copyMarkdown"
          class="action-button copy-button"
          :class="{ copied: copied }"
        >
          <span class="button-icon">{{ copied ? '✓' : '📋' }}</span>
          <span>{{ copied ? 'Copied!' : 'Copy Markdown' }}</span>
        </button>

        <button @click="downloadMarkdown" class="action-button download-button">
          <span class="button-icon">⬇️</span>
          <span>Download .md</span>
        </button>

        <button @click="togglePreview" class="action-button toggle-button">
          <span class="button-icon">{{ showPreview ? '📝' : '👁️' }}</span>
          <span>{{ showPreview ? 'Show Raw' : 'Show Preview' }}</span>
        </button>
      </div>

      <div class="content-display">
        <div
          v-if="showPreview"
          class="preview"
          v-html="renderedMarkdown"
          role="article"
        ></div>
        <pre v-else class="markdown" role="textbox" aria-label="Raw markdown content">{{
          result.markdown
        }}</pre>
      </div>
    </div>

    <footer class="app-footer">
      <div class="footer-content">
        <h3>About This Tool</h3>
        <p>
          This Web Content Extractor is designed for ethical content referencing,
          research, and collaborative work. It automatically includes proper source
          attribution and encourages responsible use of extracted content.
        </p>
        <p class="footer-note">
          <strong>Remember:</strong> Always respect copyright, attribute sources,
          and use extracted content responsibly.
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'ContentExtractor',

  data() {
    return {
      url: '',
      loading: false,
      error: null,
      result: null,
      copied: false,
      showPreview: true,
      exampleUrls: [
        {
          label: 'Blog Article',
          url: 'https://behindeverytemple.org/dharma-blog/dharmic-influencers-to-follow-in-2024/'
        }
      ]
    };
  },

  computed: {
    renderedMarkdown() {
      if (!this.result || !this.result.markdown) {
        return '';
      }
      return this.markdownToHtml(this.result.markdown);
    }
  },

  methods: {
    async extractContent() {
      if (!this.url || this.loading) {
        return;
      }

      this.loading = true;
      this.error = null;
      this.result = null;
      this.copied = false;

      try {
        // Determine API endpoint
        const apiUrl = import.meta.env.DEV
          ? '/api/extract-content'
          : '/api/extract-content';

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url: this.url })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to extract content');
        }

        this.result = data;
      } catch (err) {
        this.error = err.message || 'An error occurred while extracting content';
        console.error('Extraction error:', err);
      } finally {
        this.loading = false;
      }
    },

    async copyMarkdown() {
      if (!this.result || !this.result.markdown) {
        return;
      }

      try {
        await navigator.clipboard.writeText(this.result.markdown);
        this.copied = true;

        // Reset copied state after 2 seconds
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      } catch (err) {
        console.error('Copy failed:', err);
        this.error = 'Failed to copy to clipboard';
      }
    },

    downloadMarkdown() {
      if (!this.result || !this.result.markdown) {
        return;
      }

      const filename = this.sanitizeFilename(
        this.result.title || 'extracted-content'
      ) + '.md';

      const blob = new Blob([this.result.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);
    },

    togglePreview() {
      this.showPreview = !this.showPreview;
    },

    loadExample(exampleUrl) {
      this.url = exampleUrl;
      this.extractContent();
    },

    formatDate(dateString) {
      if (!dateString) {
        return '';
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },

    sanitizeFilename(name) {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100);
    },

    markdownToHtml(markdown) {
      let html = markdown;

      // Escape HTML to prevent XSS
      html = html.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Convert headers (h1-h6)
      html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
      html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
      html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
      html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
      html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
      html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

      // Convert horizontal rules
      html = html.replace(/^---$/gm, '<hr>');

      // Convert bold (must come before italic)
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

      // Convert italic
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

      // Convert inline code
      html = html.replace(/`(.+?)`/g, '<code>$1</code>');

      // Convert code blocks
      html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

      // Convert images (must come before links)
      html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

      // Convert links
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

      // Convert blockquotes
      html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');

      // Convert unordered lists
      html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
      html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

      // Convert ordered lists
      html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

      // Convert paragraphs (double line breaks)
      const lines = html.split('\n');
      let inList = false;
      let inCodeBlock = false;
      const processedLines = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Track code blocks
        if (trimmed.startsWith('<pre>')) {
          inCodeBlock = true;
        }
        if (trimmed.endsWith('</pre>')) {
          inCodeBlock = false;
        }

        // Track lists
        if (trimmed.startsWith('<ul>') || trimmed.startsWith('<ol>')) {
          inList = true;
        }
        if (trimmed.startsWith('</ul>') || trimmed.startsWith('</ol>')) {
          inList = false;
        }

        // Don't wrap certain elements in paragraphs
        if (
          !inCodeBlock &&
          !inList &&
          trimmed &&
          !trimmed.startsWith('<h') &&
          !trimmed.startsWith('<hr') &&
          !trimmed.startsWith('<ul') &&
          !trimmed.startsWith('<ol') &&
          !trimmed.startsWith('<li') &&
          !trimmed.startsWith('<blockquote') &&
          !trimmed.startsWith('<pre') &&
          !trimmed.startsWith('</') &&
          !trimmed.match(/^<(strong|em|code|a|img)/)
        ) {
          processedLines.push('<p>' + line + '</p>');
        } else {
          processedLines.push(line);
        }
      }

      html = processedLines.join('\n');

      return html;
    }
  }
};
</script>

<style scoped>
/* Visually hidden class for accessibility */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.content-extractor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #333;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  font-size: 2.5rem;
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin: 0 0 20px 0;
}

.ethical-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #e8f5e9;
  color: #2e7d32;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.badge-icon {
  font-size: 1.2rem;
}

/* Input Section */
.input-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.url-input-wrapper {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.url-input {
  flex: 1;
  padding: 12px 16px;
  font-size: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.url-input:focus {
  outline: none;
  border-color: #3498db;
}

.url-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.extract-button {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: #3498db;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 160px;
  justify-content: center;
}

.extract-button:hover:not(:disabled) {
  background: #2980b9;
}

.extract-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.extract-button.loading {
  background: #95a5a6;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #ffebee;
  color: #c62828;
  border-radius: 8px;
  border-left: 4px solid #c62828;
}

.error-icon {
  font-size: 1.2rem;
}

/* Examples */
.examples {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.examples-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin: 0 0 10px 0;
}

.example-link {
  display: inline-block;
  margin: 5px 10px 5px 0;
  padding: 6px 12px;
  background: #f5f5f5;
  color: #3498db;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
}

.example-link:hover:not(:disabled) {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.example-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Result Section */
.result-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

/* Metadata */
.metadata {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.article-title {
  font-size: 1.8rem;
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.metadata-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metadata-item {
  font-size: 0.95rem;
  color: #555;
}

.metadata-item strong {
  color: #2c3e50;
}

.metadata-item a {
  color: #3498db;
  text-decoration: none;
  word-break: break-all;
}

.metadata-item a:hover {
  text-decoration: underline;
}

/* Actions Bar */
.actions-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 0.95rem;
  font-weight: 500;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.action-button:hover {
  border-color: #3498db;
  color: #3498db;
}

.copy-button.copied {
  background: #27ae60;
  color: white;
  border-color: #27ae60;
}

.button-icon {
  font-size: 1.1rem;
}

/* Content Display */
.content-display {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: auto;
  max-height: 600px;
}

.preview {
  padding: 20px;
  line-height: 1.6;
}

.preview h1,
.preview h2,
.preview h3,
.preview h4,
.preview h5,
.preview h6 {
  margin: 20px 0 10px 0;
  color: #2c3e50;
}

.preview h1 {
  font-size: 2rem;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
}

.preview h2 {
  font-size: 1.6rem;
}

.preview h3 {
  font-size: 1.3rem;
}

.preview p {
  margin: 10px 0;
}

.preview a {
  color: #3498db;
  text-decoration: none;
}

.preview a:hover {
  text-decoration: underline;
}

.preview img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 10px 0;
}

.preview blockquote {
  margin: 15px 0;
  padding: 10px 20px;
  background: #f0f0f0;
  border-left: 4px solid #3498db;
  font-style: italic;
}

.preview code {
  background: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.preview pre {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 15px 0;
}

.preview pre code {
  background: none;
  padding: 0;
  color: inherit;
}

.preview ul,
.preview ol {
  margin: 10px 0;
  padding-left: 30px;
}

.preview li {
  margin: 5px 0;
}

.preview hr {
  border: none;
  border-top: 2px solid #e0e0e0;
  margin: 20px 0;
}

.markdown {
  padding: 20px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  color: #2c3e50;
}

/* Footer */
.app-footer {
  background: #2c3e50;
  color: white;
  padding: 30px;
  border-radius: 12px;
  margin-top: 40px;
}

.footer-content h3 {
  margin: 0 0 15px 0;
  font-size: 1.3rem;
}

.footer-content p {
  margin: 10px 0;
  line-height: 1.6;
  color: #ecf0f1;
}

.footer-note {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

/* Responsive Design */
@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }

  .url-input-wrapper {
    flex-direction: column;
  }

  .extract-button {
    width: 100%;
  }

  .actions-bar {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }

  .metadata-items {
    font-size: 0.9rem;
  }
}
</style>
