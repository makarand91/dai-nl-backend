import axios from 'axios';
import { StrapiNewsletterContent, StrapiNewsletterResponse } from '../types/newsletter';

const strapiClient = axios.create({
  baseURL: process.env.STRAPI_URL,
  headers: {
    Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
  },
});

/**
 * Get newsletter from Strapi 5 by documentId
 * Uses the populate parameter to include articles
 */
export async function getStrapiNewsletter(documentId: string): Promise<StrapiNewsletterContent | null> {
  try {
    const response = await strapiClient.get<StrapiNewsletterResponse>(
      `/api/news-letters/${documentId}?populate[articles][populate]=*`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching newsletter from Strapi:', error);
    return null;
  }
}

/**
 * Get all newsletters from Strapi 5
 */
export async function getAllStrapiNewsletters(): Promise<StrapiNewsletterContent[]> {
  try {
    const response = await strapiClient.get('/api/news-letters?populate[articles][populate]=*');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching newsletters from Strapi:', error);
    return [];
  }
}

/**
 * Convert Strapi newsletter with articles to HTML
 */
export function convertStrapiNewsletterToHTML(newsletter: StrapiNewsletterContent): string {
  const { articles, IssueDate, subject } = newsletter;

  // Generate article HTML
  const articlesHtml = articles
    .map(
      (article) => `
    <article style="margin-bottom: 40px; padding-bottom: 30px; border-bottom: 1px solid #e0e0e0;">
      <h2 style="color: #2c3e50; margin-bottom: 10px; font-size: 24px;">
        ${escapeHtml(article.title)}
      </h2>
      ${article.author ? `<p style="color: #7f8c8d; font-size: 14px; margin-bottom: 15px;">By ${escapeHtml(article.author)}</p>` : ''}
      ${article.is_sponsored ? `<span style="background: #f39c12; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">SPONSORED</span>` : ''}
      <div style="color: #34495e; line-height: 1.8; margin-top: 15px;">
        ${formatArticleContent(article.content)}
      </div>
      ${article.tags ? `<p style="color: #95a5a6; font-size: 12px; margin-top: 15px;">Tags: ${escapeHtml(article.tags)}</p>` : ''}
    </article>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject || 'Newsletter'} - ${IssueDate}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 30px;
          border-bottom: 2px solid #3498db;
          margin-bottom: 40px;
        }
        .header h1 {
          color: #2c3e50;
          margin: 0 0 10px 0;
          font-size: 32px;
        }
        .issue-date {
          color: #7f8c8d;
          font-size: 14px;
        }
        h2 {
          color: #2c3e50;
        }
        a {
          color: #3498db;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        .footer {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 2px solid #ecf0f1;
          text-align: center;
          font-size: 12px;
          color: #95a5a6;
        }
        .footer a {
          color: #95a5a6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${subject || 'Newsletter'}</h1>
          <p class="issue-date">Issue Date: ${new Date(IssueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        ${articlesHtml}

        <div class="footer">
          <p>You are receiving this newsletter because you subscribed to our mailing list.</p>
          <p><a href="#">Unsubscribe</a> | <a href="#">View in Browser</a></p>
          <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Format article content - handle line breaks and paragraphs
 */
function formatArticleContent(content: string): string {
  // Split by double line breaks for paragraphs
  const paragraphs = content.split(/\n\n+/);

  return paragraphs
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return '';

      // Replace single line breaks with <br>
      const formatted = trimmed.replace(/\n/g, '<br>');

      return `<p style="margin-bottom: 15px;">${escapeHtml(formatted)}</p>`;
    })
    .join('');
}
