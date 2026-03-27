// ============================================
// RedFlag — Google News RSS Layoff Collector
// ============================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
}

// ---------------------------------------------------------------------------
// XML parsing helpers (lightweight, no external dependency)
// ---------------------------------------------------------------------------

/**
 * Extracts all occurrences of a tag's text content from XML.
 * This is a simple regex-based parser sufficient for RSS feeds.
 */
function extractTagValues(xml: string, tagName: string): string[] {
  const regex = new RegExp(
    `<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tagName}>|<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`,
    "gi"
  );
  const values: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    values.push((match[1] ?? match[2] ?? "").trim());
  }
  return values;
}

/**
 * Extracts a single tag value from an XML fragment.
 */
function extractTag(xml: string, tagName: string): string {
  const values = extractTagValues(xml, tagName);
  return values[0] ?? "";
}

/**
 * Extracts the source attribute from a Google News RSS <source> tag.
 */
function extractSource(itemXml: string): string {
  const match = itemXml.match(
    /<source[^>]*url="[^"]*"[^>]*>([^<]*)<\/source>/i
  );
  return match?.[1]?.trim() ?? "Unknown";
}

/**
 * Splits RSS XML into individual <item> blocks.
 */
function extractItems(xml: string): string[] {
  const items: string[] = [];
  const regex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    items.push(match[1]);
  }
  return items;
}

/**
 * Decodes basic HTML entities.
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Strips HTML tags from a string.
 */
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Fetches layoff-related news for a company from Google News RSS.
 * No API key required.
 *
 * @param companyName - The company name to search for
 * @returns Array of news items sorted by publication date (newest first)
 */
export async function fetchLayoffNews(
  companyName: string
): Promise<NewsItem[]> {
  const query = encodeURIComponent(`${companyName} layoff`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

  console.log(`[news-rss] Fetching layoff news for "${companyName}"...`);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "RedFlag/1.0",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    const itemBlocks = extractItems(xml);

    console.log(
      `[news-rss] Found ${itemBlocks.length} news items for "${companyName}"`
    );

    const items: NewsItem[] = itemBlocks.map((block) => {
      const rawTitle = extractTag(block, "title");
      const rawLink = extractTag(block, "link");
      const rawPubDate = extractTag(block, "pubDate");
      const rawDescription = extractTag(block, "description");
      const source = extractSource(block);

      return {
        title: decodeHtmlEntities(stripHtml(rawTitle)),
        link: rawLink,
        pubDate: rawPubDate
          ? new Date(rawPubDate).toISOString()
          : new Date().toISOString(),
        source,
        description: decodeHtmlEntities(stripHtml(rawDescription)).slice(
          0,
          500
        ),
      };
    });

    // Sort newest first
    items.sort(
      (a, b) =>
        new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    );

    return items;
  } catch (err) {
    console.error(
      `[news-rss] Failed to fetch news for "${companyName}":`,
      (err as Error).message
    );
    return [];
  }
}
