# Creating Newsletter Templates

This guide shows you how to create custom newsletter templates for different brands.

## Template Location

Templates are stored in: **`lib/templates/`**

```
lib/templates/
├── types.ts                 # Template interfaces (don't modify)
├── default-template.ts      # Simple, clean template
├── modern-template.ts       # Bold, colorful template
├── corporate-template.ts    # Professional minimal design (example)
└── index.ts                # Template registry
```

## Step-by-Step: Create a New Template

### 1. Create Template File

Create a new file in `lib/templates/`, e.g., `lib/templates/my-brand-template.ts`:

```typescript
import { NewsletterTemplate, TemplateData } from './types';

/**
 * My Brand Newsletter Template
 *
 * Description of your template design
 */

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMyBrandTemplate(data: TemplateData): string {
  // Generate article HTML
  const articles = data.articles
    .map(
      (article) => `
    <div style="margin-bottom: 24px; padding: 20px; background: #ffffff;">
      <h2 style="margin: 0 0 8px 0; font-size: 24px; color: #000000;">
        ${escapeHtml(article.title)}
      </h2>
      ${article.author ? `<p style="color: #666;">By ${escapeHtml(article.author)}</p>` : ''}
      <div style="margin-top: 12px; line-height: 1.6;">
        ${article.content}
      </div>
    </div>
  `
    )
    .join('');

  // Return complete HTML email
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.subject)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">

    <!-- Header -->
    <div style="padding: 40px 20px; background: #YOUR_BRAND_COLOR; text-align: center;">
      <h1 style="margin: 0; color: #ffffff;">
        ${escapeHtml(data.subject)}
      </h1>
      <p style="margin: 8px 0 0 0; color: #ffffff;">
        ${new Date(data.issueDate).toLocaleDateString()}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px;">
      ${articles}
    </div>

    <!-- Footer -->
    <div style="padding: 20px; background: #f9f9f9; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        <a href="#" style="color: #666;">Unsubscribe</a>
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

// Export the template
export const myBrandTemplate: NewsletterTemplate = {
  id: 'my-brand',              // Unique ID (use in brand settings)
  name: 'My Brand',             // Display name (shown in UI)
  description: 'Custom design for my brand',  // Description
  render: renderMyBrandTemplate,
};
```

### 2. Register the Template

Edit `lib/templates/index.ts` and add your template:

```typescript
import { NewsletterTemplate } from './types';
import { defaultTemplate } from './default-template';
import { modernTemplate } from './modern-template';
import { myBrandTemplate } from './my-brand-template';  // Add import

// Template Registry
const templates = new Map<string, NewsletterTemplate>([
  [defaultTemplate.id, defaultTemplate],
  [modernTemplate.id, modernTemplate],
  [myBrandTemplate.id, myBrandTemplate],  // Add to registry
]);

// ... rest of file ...

// Re-export types and templates
export * from './types';
export { defaultTemplate } from './default-template';
export { modernTemplate } from './modern-template';
export { myBrandTemplate } from './my-brand-template';  // Add export
```

### 3. Map Template to Brand

Go to `/settings/brands` in your app UI and:

1. Click "Add New Brand"
2. Enter Brand ID (must match Strapi's `brand` field)
3. Select your new template from dropdown
4. Add optional customization (colors, logos, etc.)
5. Click "Add Brand"
6. Click "Save All Changes"

**Or via DynamoDB directly:**

Your template will now appear in the dropdown automatically!

## Template Data Structure

Your template receives a `TemplateData` object:

```typescript
interface TemplateData {
  subject: string;        // Newsletter subject
  issueDate: string;      // ISO date string
  articles: ArticleData[]; // Array of articles
  brand?: string;         // Brand identifier
  uid?: string;          // Unique ID from Strapi
}

interface ArticleData {
  title: string;
  content: string;        // HTML content from Strapi
  author?: string;
  isSponsored: boolean;
  tags?: string;
  slug: string;
}
```

## Best Practices

### 1. Use Inline Styles

Email clients don't support `<style>` tags well. Use inline styles:

```html
<!-- ✅ Good -->
<div style="padding: 20px; background: #fff;">

<!-- ❌ Bad -->
<div class="container">
```

### 2. Escape User Content

Always escape HTML to prevent XSS:

```typescript
${escapeHtml(article.title)}  // ✅ Good
${article.title}              // ❌ Bad - XSS risk
```

### 3. Test in Multiple Email Clients

- Gmail
- Outlook
- Apple Mail
- Mobile devices

### 4. Keep Width Under 600px

Most email clients work best with 600px max width:

```html
<div style="max-width: 600px; margin: 0 auto;">
```

### 5. Use Web-Safe Fonts

Stick to fonts available on all systems:
- Arial, Helvetica, sans-serif
- Georgia, serif
- Courier New, monospace
- Times New Roman, serif

### 6. Add Alt Text for Images

If you add images:

```html
<img src="logo.png" alt="Company Logo" style="width: 100px;">
```

## Customization Per Brand

You can access brand settings in your template:

```typescript
// In lib/settings/brand-settings.ts, brands can have:
{
  "my-brand": {
    "templateId": "my-brand",
    "customization": {
      "primaryColor": "#ff6600",
      "logo": "https://example.com/logo.png"
    }
  }
}
```

To use these in your template, you'll need to pass them through `TemplateData` or fetch settings within your template render function.

## Testing Your Template

### 1. Build Test

```bash
npm run build
```

### 2. Create Test Newsletter

1. Start dev server: `npm run dev`
2. Go to dashboard
3. Create newsletter with Strapi document ID
4. Check preview

### 3. Send Preview Email

Click "Send Preview" to see how it looks in your email client.

## Example Templates

Look at existing templates for reference:

- **`default-template.ts`** - Simple, clean design
- **`modern-template.ts`** - Bold colors, gradients
- **`corporate-template.ts`** - Professional, minimal

## Common Customizations

### Brand Colors

```typescript
// In your template
const brandColor = data.brand === 'brand-a' ? '#ff6600' : '#0066ff';
```

### Conditional Sections

```typescript
// Show sponsor message if article is sponsored
${article.isSponsored ? `<div>Sponsored Content</div>` : ''}
```

### Custom Headers per Brand

```typescript
const getHeader = (brand?: string) => {
  if (brand === 'tech-brand') return 'Tech Weekly';
  if (brand === 'news-brand') return 'Daily News';
  return 'Newsletter';
};
```

## Troubleshooting

### Template Not Showing in Dropdown

1. Check you registered it in `lib/templates/index.ts`
2. Restart dev server: `npm run dev`
3. Rebuild: `npm run build`

### Email Looks Broken

1. Use inline styles (not CSS classes)
2. Test in multiple email clients
3. Check for proper HTML escaping
4. Validate HTML structure

### Template ID Already Exists

Each template needs a unique `id`. Check existing IDs in `lib/templates/index.ts`.

## Need Help?

- Review existing templates in `lib/templates/`
- Check email design best practices online
- Test thoroughly in multiple email clients
- Consider using email template testing services like Litmus or Email on Acid
