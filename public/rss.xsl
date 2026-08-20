<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> (RSS Feed)</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          :root {
            --bg-paper: #ebf3ee;
            --text-ink: #1a1a19;
            --text-muted: rgba(26, 26, 25, 0.6);
            --border-faint: rgba(26, 26, 25, 0.12);
            --bg-subtle: rgba(26, 26, 25, 0.035);
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            background-color: var(--bg-paper);
            color: var(--text-ink);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 15px;
            line-height: 1.6;
            padding: 3.5rem 1.5rem 6rem;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 680px;
            margin: 0 auto;
          }
          header {
            margin-bottom: 3rem;
          }
          .back-link {
            display: inline-block;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--text-muted);
            text-decoration: none;
            margin-bottom: 1.75rem;
            transition: opacity 0.2s ease;
          }
          .back-link:hover {
            opacity: 0.5;
          }
          h1 {
            font-size: 1.75rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            line-height: 1.2;
            margin-bottom: 0.5rem;
          }
          .feed-desc {
            color: var(--text-muted);
            font-size: 0.95rem;
            margin-bottom: 2rem;
          }
          .info-banner {
            border: 1px solid var(--border-faint);
            padding: 1.25rem 1.5rem;
            font-size: 0.85rem;
            line-height: 1.55;
          }
          .info-banner-title {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-weight: 600;
            margin-bottom: 0.35rem;
          }
          .info-banner p {
            color: var(--text-muted);
          }
          .url-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin-top: 1rem;
          }
          .url-row code {
            padding: 0.4rem 0.65rem;
            background: var(--bg-subtle);
            border: 1px solid var(--border-faint);
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.75rem;
            color: var(--text-ink);
            word-break: break-all;
            flex: 1 1 auto;
          }
          .copy-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.45rem 0.85rem;
            background: var(--text-ink);
            color: var(--bg-paper);
            border: 1px solid var(--text-ink);
            border-radius: 9999px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            cursor: pointer;
            transition: opacity 0.2s ease, background-color 0.2s ease, color 0.2s ease;
          }
          .copy-btn:hover {
            opacity: 0.6;
          }
          .copy-btn.copied {
            background: var(--bg-paper);
            color: var(--text-ink);
            border-color: var(--text-ink);
            opacity: 1;
          }
          footer {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid var(--border-faint);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--text-muted);
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <a href="/fields" class="back-link">← Back to Fields</a>
            <h1><xsl:value-of select="/rss/channel/title"/></h1>
            <p class="feed-desc"><xsl:value-of select="/rss/channel/description"/></p>
            
            <div class="info-banner">
              <div class="info-banner-title">RSS Feed</div>
              <p>To subscribe, copy the feed URL below into your reader (NetNewsWire, Feedly, Reeder, etc.):</p>
              <div class="url-row">
                <code id="feed-url"><xsl:value-of select="/rss/channel/link"/>rss.xml</code>
                <button id="copy-btn" class="copy-btn" onclick="copyFeedUrl()" type="button" aria-label="Copy RSS URL">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span id="copy-text">Copy URL</span>
                </button>
              </div>
            </div>
          </header>

          <footer>
            Graziano Enzo Marchesani — <a href="https://grazianoenzomarchesani.xyz" style="color: inherit; text-decoration: none;">grazianoenzomarchesani.xyz</a>
          </footer>
        </div>
        <script type="text/javascript">
          function copyFeedUrl() {
            var url = document.getElementById('feed-url').textContent;
            var btn = document.getElementById('copy-btn');
            var text = document.getElementById('copy-text');
            navigator.clipboard.writeText(url).then(function() {
              btn.classList.add('copied');
              text.textContent = 'Copied!';
              setTimeout(function() {
                btn.classList.remove('copied');
                text.textContent = 'Copy URL';
              }, 2000);
            }).catch(function() {
              text.textContent = 'Failed';
            });
          }
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
