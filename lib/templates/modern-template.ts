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
      return `<p style="margin-bottom: 15px; line-height: 1.8;">${escapeHtml(formatted)}</p>`;
    })
    .join('');
}

export const modernTemplate: NewsletterTemplate = {
  id: 'modern',
  name: 'Modern Template',
  description: 'Bold and colorful modern newsletter design',
  render: (data: TemplateData) => {
    const articlesHtml = data.articles
      .map(
        (article, index) => `
      <article style="margin-bottom: 30px; background: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'}; padding: 30px; border-radius: 12px; border-left: 4px solid #667eea;">
        ${article.isSponsored ? `<div style="margin-bottom: 15px;"><span style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 1px;">SPONSORED CONTENT</span></div>` : ''}
        <h2 style="color: #1a202c; margin: 0 0 15px 0; font-size: 26px; font-weight: 700; line-height: 1.3;">
          ${escapeHtml(article.title)}
        </h2>
        ${article.author ? `<div style="display: flex; align-items: center; margin-bottom: 20px;"><div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; margin-right: 12px;">${escapeHtml(article.author.charAt(0).toUpperCase())}</div><div><p style="margin: 0; color: #4a5568; font-size: 14px; font-weight: 600;">${escapeHtml(article.author)}</p></div></div>` : ''}
        <div style="color: #2d3748; line-height: 1.8; font-size: 16px;">
          ${formatContent(article.content)}
        </div>
        ${article.tags ? `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;"><p style="color: #718096; font-size: 13px; margin: 0;">🏷️ ${escapeHtml(article.tags)}</p></div>` : ''}
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
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="max-width: 650px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 40px; text-align: center;">
              <h1 style="color: white; margin: 0 0 15px 0; font-size: 36px; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                ${escapeHtml(data.subject)}
              </h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0; font-weight: 500;">
                📅 ${new Date(data.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div style="padding: 40px;">
              ${articlesHtml}
            </div>

            <div style="background: #f7fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 15px 0; color: #718096; font-size: 14px;">
                📧 You're receiving this because you subscribed to our newsletter
              </p>
              <p style="margin: 0 0 25px 0;">
                <a href="#" style="color: #667eea; text-decoration: none; font-weight: 600; margin: 0 15px; font-size: 14px;">Unsubscribe</a>
                <span style="color: #cbd5e0;">•</span>
                <a href="#" style="color: #667eea; text-decoration: none; font-weight: 600; margin: 0 15px; font-size: 14px;">View in Browser</a>
              </p>
              <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                &copy; ${new Date().getFullYear()} All rights reserved
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  },
};
