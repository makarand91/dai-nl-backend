import axios from 'axios';
import { StrapiNewsletterContent, StrapiNewsletterResponse } from '../types/newsletter';
import { getTemplate } from '../templates';
import { getTemplateForBrand } from '../settings/brand-settings';
import { TemplateData } from '../templates/types';

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
 * Convert Strapi newsletter to HTML using template system
 * Automatically selects template based on brand mapping
 */
export function convertStrapiNewsletterToHTML(newsletter: StrapiNewsletterContent): string {
  // Get the appropriate template based on brand
  const templateId = getTemplateForBrand(newsletter.brand);
  const template = getTemplate(templateId);

  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Prepare template data
  const templateData: TemplateData = {
    subject: newsletter.subject || `Newsletter - ${newsletter.IssueDate}`,
    issueDate: newsletter.IssueDate,
    brand: newsletter.brand || undefined,
    uid: newsletter.uid || undefined,
    articles: newsletter.articles.map((article) => ({
      title: article.title,
      content: article.content,
      author: article.author,
      isSponsored: article.is_sponsored || false,
      tags: article.tags || undefined,
      slug: article.slug,
    })),
  };

  // Render using the selected template
  return template.render(templateData);
}
