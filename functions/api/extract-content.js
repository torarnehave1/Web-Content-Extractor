/**
 * Web Content Extractor - Cloudflare Worker
 * Fetches web content and converts to markdown with proper attribution
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = buildCorsHeaders(request);

  // Handle OPTIONS request for CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!isAllowedOrigin(request)) {
      return unauthorizedResponse(request, corsHeaders, 'Origin not allowed');
    }

    const authResult = await verifyAdminSession(request);
    if (!authResult.ok) {
      return unauthorizedResponse(request, corsHeaders, 'Login required', authResult.status);
    }

    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const {
      url,
      html,
      saveToKnowledgeGraph,
      knowledgeGraphId,
      knowledgeGraphTitle,
      knowledgeGraphDescription,
      knowledgeGraphCreatedBy,
      knowledgeGraphOverride
    } = payload || {};

    if (!url && !html) {
      return new Response(JSON.stringify({ error: 'URL or HTML is required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate URL format when provided
    if (url) {
      try {
        const validUrl = new URL(url);
        if (!['http:', 'https:'].includes(validUrl.protocol)) {
          throw new Error('Invalid protocol');
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
          status: 400,
          headers: corsHeaders
        });
      }
    }

    let resolvedHtml = html;

    if (!resolvedHtml) {
      // Fetch webpage
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ContentExtractor/1.0; +https://github.com/yourusername/web-content-extractor)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        // Timeout after 10 seconds
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        return new Response(JSON.stringify({
          error: `Failed to fetch: ${response.status} ${response.statusText}`
        }), {
          status: response.status,
          headers: corsHeaders
        });
      }

      resolvedHtml = await response.text();
    }

    // Extract content and convert to markdown
    const extracted = extractContent(resolvedHtml, url || '');

    let knowledgeGraphResult = null;
    if (saveToKnowledgeGraph) {
      knowledgeGraphResult = await saveToKnowledgeGraphWorker(env, extracted, {
        id: knowledgeGraphId,
        title: knowledgeGraphTitle,
        description: knowledgeGraphDescription,
        createdBy: knowledgeGraphCreatedBy,
        override: knowledgeGraphOverride
      });
    }

    // Optional: Save to D1 database if configured
    // if (env.DB) {
    //   await saveToDatabase(env.DB, extracted);
    // }

    return new Response(JSON.stringify({
      success: true,
      ...extracted,
      knowledgeGraph: knowledgeGraphResult
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Extraction error:', error);

    return new Response(JSON.stringify({
      error: error.message || 'Failed to extract content'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

function buildCorsHeaders(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigin = origin === 'https://www.vegvisr.org' ? origin : '*';
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (allowedOrigin !== '*') {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

function unauthorizedResponse(request, corsHeaders, reason, status = 401) {
  const accept = request.headers.get('Accept') || '';
  if (accept.includes('text/html')) {
    const body = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login Required</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; margin: 0; padding: 48px; background: #f6f7fb; color: #1f2a37; }
      .card { max-width: 560px; margin: 0 auto; background: #fff; padding: 28px; border-radius: 12px; box-shadow: 0 6px 24px rgba(15, 23, 42, 0.08); }
      h1 { margin: 0 0 12px; font-size: 1.5rem; }
      p { margin: 0 0 18px; line-height: 1.6; }
      a.button { display: inline-block; padding: 10px 16px; background: #1d4ed8; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; }
      .note { margin-top: 16px; font-size: 0.9rem; color: #4b5563; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Login required</h1>
      <p>This tool is provided by Vegvisr and is only available to Admin and Superadmin users.</p>
      <p>Please log in to Vegvisr to continue.</p>
      <a class="button" href="https://www.vegvisr.org/">Go to Vegvisr Login</a>
      <div class="note">${reason || 'Access restricted'}</div>
    </div>
  </body>
</html>`;

    return new Response(body, {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  return new Response(JSON.stringify({ error: reason || 'Unauthorized' }), {
    status,
    headers: corsHeaders
  });
}

function isAllowedOrigin(request) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== 'https://www.vegvisr.org') {
    return false;
  }

  const referer = request.headers.get('Referer');
  if (referer && !referer.startsWith('https://www.vegvisr.org/')) {
    return false;
  }

  return true;
}

async function verifyAdminSession(request) {
  const cookie = request.headers.get('Cookie');
  if (!cookie) {
    return { ok: false, status: 401 };
  }

  try {
    const response = await fetch('https://auth.vegvisr.org/auth/openauth/session', {
      method: 'GET',
      headers: {
        Cookie: cookie,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    const data = await response.json().catch(() => null);
    const role = data?.subject?.role;
    if (data?.success && (role === 'Superadmin' || role === 'Admin')) {
      return { ok: true, status: 200 };
    }

    return { ok: false, status: 403 };
  } catch (error) {
    console.error('Auth check failed:', error);
    return { ok: false, status: 500 };
  }
}

/**
 * Extract content from HTML and convert to markdown
 */
function extractContent(html, sourceUrl) {
  // Remove script and style tags
  let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Extract metadata
  const metadata = extractMetadata(html, sourceUrl);

  // Find main content
  const mainContent = findMainContent(cleanHtml);

  // Convert to markdown
  const markdown = htmlToMarkdown(mainContent);

  // Build final markdown with attribution
  const finalMarkdown = buildMarkdownWithAttribution(markdown, metadata);

  return {
    url: sourceUrl,
    title: metadata.title,
    author: metadata.author,
    date: metadata.date,
    description: metadata.description,
    markdown: finalMarkdown,
    extractedAt: new Date().toISOString()
  };
}

/**
 * Extract metadata from HTML
 */
function extractMetadata(html, sourceUrl) {
  const metadata = {
    title: '',
    author: '',
    date: '',
    description: '',
    url: sourceUrl
  };

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    metadata.title = decodeHtmlEntities(titleMatch[1].trim());
  }

  // Extract Open Graph title
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  if (ogTitleMatch) {
    metadata.title = decodeHtmlEntities(ogTitleMatch[1]);
  }

  // Extract canonical or Open Graph URL
  if (!metadata.url) {
    const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    if (canonicalMatch) {
      metadata.url = canonicalMatch[1];
    }
  }

  if (!metadata.url) {
    const ogUrlMatch = html.match(/<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i);
    if (ogUrlMatch) {
      metadata.url = ogUrlMatch[1];
    }
  }

  // Extract author
  const authorMatch = html.match(/<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i);
  if (authorMatch) {
    metadata.author = decodeHtmlEntities(authorMatch[1]);
  }

  // Extract article:author
  const articleAuthorMatch = html.match(/<meta\s+property=["']article:author["']\s+content=["']([^"']+)["']/i);
  if (articleAuthorMatch) {
    metadata.author = decodeHtmlEntities(articleAuthorMatch[1]);
  }

  // Extract published date
  const dateMatch = html.match(/<meta\s+property=["']article:published_time["']\s+content=["']([^"']+)["']/i);
  if (dateMatch) {
    metadata.date = dateMatch[1];
  }

  // Extract description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (descMatch) {
    metadata.description = decodeHtmlEntities(descMatch[1]);
  }

  return metadata;
}

/**
 * Find the main content area in HTML
 */
function findMainContent(html) {
  // Try to find main content container
  // Priority: article > main > .content > .post > body

  let content = '';

  // Try <article> tag
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    content = articleMatch[1];
  }

  // Try <main> tag
  if (!content) {
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      content = mainMatch[1];
    }
  }

  // Try common content class names
  if (!content) {
    const contentPatterns = [
      /<div[^>]*class=["'][^"']*\b(content|article|post|entry|main-content|post-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id=["'][^"']*\b(content|article|post|entry|main-content|post-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
    ];

    for (const pattern of contentPatterns) {
      const match = html.match(pattern);
      if (match) {
        content = match[2];
        break;
      }
    }
  }

  // Fallback to body content
  if (!content) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      content = bodyMatch[1];
    }
  }

  // Remove common non-content elements
  content = content.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '');
  content = content.replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '');
  content = content.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '');
  content = content.replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, '');
  content = content.replace(/<div[^>]*class=["'][^"']*(sidebar|advertisement|ad-|promo)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');

  return content || html;
}

/**
 * Convert HTML to Markdown
 */
function htmlToMarkdown(html) {
  let markdown = html;

  // Convert headers (h1-h6)
  markdown = markdown.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n\n');
  markdown = markdown.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n##### $1\n\n');
  markdown = markdown.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n###### $1\n\n');

  // Convert bold
  markdown = markdown.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');

  // Convert italic
  markdown = markdown.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');

  // Convert links
  markdown = markdown.replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Convert images
  markdown = markdown.replace(/<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/gi, '![$2]($1)');
  markdown = markdown.replace(/<img[^>]+alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*\/?>/gi, '![$1]($2)');
  markdown = markdown.replace(/<img[^>]+src=["']([^"']+)["'][^>]*\/?>/gi, '![]($1)');

  // Convert blockquotes
  markdown = markdown.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
    const lines = content.trim().split('\n');
    return '\n' + lines.map(line => '> ' + line.trim()).join('\n') + '\n\n';
  });

  // Convert code blocks
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '\n```\n$1\n```\n\n');
  markdown = markdown.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n\n');

  // Convert inline code
  markdown = markdown.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');

  // Convert unordered lists
  markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
    let items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    return '\n' + items.map(item => {
      const text = item.replace(/<\/?li[^>]*>/gi, '').trim();
      return '- ' + text;
    }).join('\n') + '\n\n';
  });

  // Convert ordered lists
  markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    let items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    return '\n' + items.map((item, index) => {
      const text = item.replace(/<\/?li[^>]*>/gi, '').trim();
      return `${index + 1}. ${text}`;
    }).join('\n') + '\n\n';
  });

  // Convert paragraphs
  markdown = markdown.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n\n');

  // Convert line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

  // Convert horizontal rules
  markdown = markdown.replace(/<hr\s*\/?>/gi, '\n---\n\n');

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  markdown = decodeHtmlEntities(markdown);

  // Clean up whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
  markdown = markdown.replace(/[ \t]+/g, ' '); // Normalize spaces
  markdown = markdown.trim();

  return markdown;
}

/**
 * Build markdown with proper attribution
 */
function buildMarkdownWithAttribution(markdown, metadata) {
  let output = '';

  // Add title
  if (metadata.title) {
    output += `# ${metadata.title}\n\n`;
  }

  // Add metadata section
  output += '---\n\n';

  if (metadata.author) {
    output += `**Author:** ${metadata.author}\n\n`;
  }

  if (metadata.date) {
    const date = new Date(metadata.date);
    const formattedDate = isNaN(date.getTime()) ? metadata.date : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    output += `**Published:** ${formattedDate}\n\n`;
  }

  if (metadata.url) {
    output += `**Source:** [${metadata.url}](${metadata.url})\n\n`;
  }
  output += '---\n\n';

  // Add main content
  output += markdown;

  // Add ethical disclaimer
  output += '\n\n---\n\n';
  output += '## Ethical Use Notice\n\n';
  output += 'This content was extracted for educational and reference purposes. ';
  output += 'All rights belong to the original author and publisher. ';
  output += 'Please respect copyright and always attribute the source when using this content.\n\n';
  if (metadata.url) {
    output += `**Original Source:** [${metadata.url}](${metadata.url})\n`;
  } else {
    output += '**Original Source:** (not provided)\n';
  }
  output += `**Extracted:** ${new Date().toLocaleString('en-US')}\n`;

  return output;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&bull;': '•',
    '&middot;': '·',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™'
  };

  let decoded = text;

  // Replace named entities
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.split(entity).join(char);
  }

  // Replace numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

  return decoded;
}

/**
 * Save markdown to knowledge-graph-worker via service binding
 */
async function saveToKnowledgeGraphWorker(env, extracted, options) {
  if (!env?.KNOWLEDGE_GRAPH_WORKER?.fetch) {
    return { saved: false, error: 'Knowledge graph service binding is not configured' };
  }

  const graphId = options?.id || `graph_${Date.now()}`;
  const graphData = buildKnowledgeGraphData(extracted, {
    title: options?.title,
    description: options?.description,
    createdBy: options?.createdBy
  });

  try {
    const response = await env.KNOWLEDGE_GRAPH_WORKER.fetch(
      'https://knowledge-graph-worker/saveGraphWithHistory',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: graphId,
          graphData,
          override: Boolean(options?.override)
        })
      }
    );

    const text = await response.text();
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { message: text };
    }

    if (!response.ok) {
      return { saved: false, id: graphId, error: parsed?.error || text };
    }

    return { saved: true, id: graphId, response: parsed };
  } catch (error) {
    return { saved: false, id: graphId, error: error.message || 'Save failed' };
  }
}

function buildKnowledgeGraphData(extracted, options) {
  const title = options?.title || extracted.title || extracted.url || 'Extracted Content';
  const description = options?.description || extracted.description || '';
  const createdBy = options?.createdBy || 'web-content-extractor';
  const sourceUrl = extracted.url || '';

  return {
    metadata: {
      title,
      description,
      createdBy,
      version: 0
    },
    nodes: [
      {
        id: crypto.randomUUID(),
        color: '#4f6d7a',
        label: title,
        type: 'fulltext',
        info: extracted.markdown,
        bibl: sourceUrl ? [sourceUrl] : [],
        imageWidth: null,
        imageHeight: null,
        visible: true,
        position: { x: 0, y: 0 },
        path: null
      }
    ],
    edges: []
  };
}

/**
 * Save extracted content to D1 database (optional)
 */
async function saveToDatabase(db, data) {
  try {
    await db.prepare(
      `INSERT INTO extracted_content (url, title, author, date, markdown, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(url) DO UPDATE SET
       markdown = excluded.markdown,
       created_at = excluded.created_at`
    ).bind(
      data.url,
      data.title,
      data.author,
      data.date,
      data.markdown,
      new Date().toISOString()
    ).run();
  } catch (error) {
    console.error('Database error:', error);
    // Don't throw - database is optional
  }
}
