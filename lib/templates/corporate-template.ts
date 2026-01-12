import { NewsletterTemplate, TemplateData } from './types';

/**
 * Corporate Newsletter Template
 *
 * Professional, minimal design with:
 * - Navy blue header
 * - Serif fonts for elegance
 * - Clean layout with subtle borders
 * - Perfect for corporate/business brands
 */

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderCorporateTemplate(data: TemplateData): string {
  const articles = data.articles
    .map(
      (article) => `
    <div style="margin-bottom: 32px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 4px; background: #ffffff;">
      <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 600; color: #1e3a8a; font-family: Georgia, serif;">
        ${escapeHtml(article.title)}
      </h2>
      ${
        article.author
          ? `<p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; font-style: italic;">
          By ${escapeHtml(article.author)}
        </p>`
          : ''
      }
      <div style="margin: 16px 0; font-size: 16px; line-height: 1.6; color: #374151; font-family: Georgia, serif;">
        ${article.content}
      </div>
      ${
        article.isSponsored
          ? `<div style="margin-top: 12px; padding: 8px 12px; background: #f3f4f6; border-left: 3px solid #1e3a8a; font-size: 12px; color: #6b7280;">
          Sponsored Content
        </div>`
          : ''
      }
    </div>
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
<body style="margin: 0; padding: 0; font-family: Georgia, serif; background-color: #f9fafb;">
  <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; font-family: Georgia, serif; letter-spacing: 1px;">
        ${escapeHtml(data.subject)}
      </h1>
      <p style="margin: 12px 0 0 0; font-size: 14px; color: #dbeafe; letter-spacing: 0.5px;">
        ${escapeHtml(new Date(data.issueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }))}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 24px;">
      ${articles}
    </div>

    <!-- Footer -->
    <div style="padding: 32px 24px; background-color: #f9fafb; border-top: 2px solid #1e3a8a; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
        Thank you for reading our newsletter
      </p>
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        © ${new Date().getFullYear()} All rights reserved. |
        <a href="#" style="color: #1e3a8a; text-decoration: none;">Unsubscribe</a>
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

export const corporateTemplate: NewsletterTemplate = {
  id: 'corporate',
  name: 'Corporate',
  description: 'Professional minimal design with navy blue theme',
  render: renderCorporateTemplate,
};
