import { NewsletterTemplate } from './types';
import { defaultTemplate } from './default-template';
import { modernTemplate } from './modern-template';

// Template Registry
const templates = new Map<string, NewsletterTemplate>([
  [defaultTemplate.id, defaultTemplate],
  [modernTemplate.id, modernTemplate],
]);

/**
 * Get a newsletter template by ID
 */
export function getTemplate(templateId: string): NewsletterTemplate | undefined {
  return templates.get(templateId);
}

/**
 * Get all available templates
 */
export function getAllTemplates(): NewsletterTemplate[] {
  return Array.from(templates.values());
}

/**
 * Register a new custom template
 */
export function registerTemplate(template: NewsletterTemplate): void {
  templates.set(template.id, template);
}

// Re-export types and templates
export * from './types';
export { defaultTemplate } from './default-template';
export { modernTemplate } from './modern-template';
