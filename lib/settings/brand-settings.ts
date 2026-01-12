/**
 * Brand to Template Mapping Configuration
 *
 * This file maps brand identifiers to newsletter templates.
 * Update this file to change which template is used for each brand.
 */

export interface BrandSettings {
  templateId: string;
  defaultSubject?: string;
  customization?: {
    primaryColor?: string;
    logo?: string;
    [key: string]: any;
  };
}

/**
 * Brand to Template Mapping
 *
 * Add your brands here and map them to template IDs.
 * Available templates: 'default', 'modern'
 */
export const brandTemplateMap: Record<string, BrandSettings> = {
  // Default fallback (when brand is null or not found)
  default: {
    templateId: 'default',
  },

  // Example brand configurations
  'brand-a': {
    templateId: 'modern',
    defaultSubject: 'Brand A Newsletter',
    customization: {
      primaryColor: '#667eea',
    },
  },

  'brand-b': {
    templateId: 'default',
    defaultSubject: 'Brand B Weekly Update',
  },

  // Add more brand mappings here...
  // 'your-brand-id': {
  //   templateId: 'default',
  //   defaultSubject: 'Your Brand Newsletter',
  // },
};

/**
 * Get template ID for a brand
 */
export function getTemplateForBrand(brand?: string | null): string {
  if (!brand) {
    return brandTemplateMap.default.templateId;
  }

  const settings = brandTemplateMap[brand];
  if (!settings) {
    console.warn(`No template mapping found for brand: ${brand}. Using default template.`);
    return brandTemplateMap.default.templateId;
  }

  return settings.templateId;
}

/**
 * Get brand settings
 */
export function getBrandSettings(brand?: string | null): BrandSettings {
  if (!brand) {
    return brandTemplateMap.default;
  }

  return brandTemplateMap[brand] || brandTemplateMap.default;
}
