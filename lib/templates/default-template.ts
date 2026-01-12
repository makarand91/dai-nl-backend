import { NewsletterTemplate, TemplateData } from './types';

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

function formatContent(content: string): string {
  const paragraphs = content.split(/\n\n+/);
  return paragraphs
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      const formatted = trimmed.replace(/\n/g, '<br>');
      return `<p style="margin-bottom: 15px; line-height: 1.6;">${escapeHtml(formatted)}</p>`;
    })
    .join('');
}

export const defaultTemplate: NewsletterTemplate = {
  id: 'default',
  name: 'Default Template',
  description: 'Clean and simple newsletter template',
  render: (data: TemplateData) => {
    const articlesHtml = data.articles
      .map(
        (article) => `
      <article style="margin-bottom: 40px; padding-bottom: 30px; border-bottom: 1px solid #e0e0e0;">
        <h2 style="color: #2c3e50; margin-bottom: 10px; font-size: 24px; font-weight: 600;">
          ${escapeHtml(article.title)}
        </h2>
        ${article.author ? `<p style="color: #7f8c8d; font-size: 14px; margin-bottom: 15px;">By ${escapeHtml(article.author)}</p>` : ''}
        ${article.isSponsored ? `<span style="display: inline-block; background: #f39c12; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 15px;">SPONSORED</span>` : ''}
        <div style="color: #34495e; line-height: 1.8; margin-top: 15px;">
          ${formatContent(article.content)}
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
        <title>${escapeHtml(data.subject)}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding-bottom: 30px; border-bottom: 2px solid #3498db; margin-bottom: 40px;">
              <h1 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 32px; font-weight: 700;">
                ${escapeHtml(data.subject)}
              </h1>
              <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
                ${new Date(data.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            ${articlesHtml}

            <div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid #ecf0f1; text-align: center; font-size: 12px; color: #95a5a6;">
              <p style="margin: 0 0 10px 0;">You are receiving this newsletter because you subscribed to our mailing list.</p>
              <p style="margin: 0 0 20px 0;">
                <a href="#" style="color: #95a5a6; text-decoration: none; margin: 0 10px;">Unsubscribe</a>
                <span style="color: #ddd;">|</span>
                <a href="#" style="color: #95a5a6; text-decoration: none; margin: 0 10px;">View in Browser</a>
              </p>
              <p style="margin: 0; color: #bdc3c7;">&copy; ${new Date().getFullYear()} All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  },
};
