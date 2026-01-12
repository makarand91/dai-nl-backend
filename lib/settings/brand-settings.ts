/**
 * Brand to Template Mapping Configuration
 *
 * This file maps brand identifiers to newsletter templates.
 * Brand mappings are stored in data/brand-settings.json and can be updated via API.
 */

import fs from 'fs';
import path from 'path';

export interface BrandSettings {
  templateId: string;
  defaultSubject?: string;
  customization?: {
    primaryColor?: string;
    logo?: string;
    [key: string]: any;
  };
}

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'brand-settings.json');

// In-memory cache
let cachedSettings: Record<string, BrandSettings> | null = null;

/**
 * Load brand settings from JSON file
 */
export function loadBrandSettings(): Record<string, BrandSettings> {
  if (cachedSettings) {
    return cachedSettings;
  }

  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const fileContent = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      cachedSettings = JSON.parse(fileContent);
      return cachedSettings!;
    }
  } catch (error) {
    console.error('Error loading brand settings:', error);
  }

  // Default fallback
  return {
    default: {
      templateId: 'default',
    },
  };
}

/**
 * Save brand settings to JSON file
 */
export function saveBrandSettings(settings: Record<string, BrandSettings>): void {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    cachedSettings = settings; // Update cache
  } catch (error) {
    console.error('Error saving brand settings:', error);
    throw new Error('Failed to save brand settings');
  }
}

/**
 * Clear cache (useful after updates)
 */
export function clearBrandSettingsCache(): void {
  cachedSettings = null;
}

/**
 * Get brand template map
 */
export function getBrandTemplateMap(): Record<string, BrandSettings> {
  return loadBrandSettings();
}

/**
 * Get template ID for a brand
 */
export function getTemplateForBrand(brand?: string | null): string {
  const brandTemplateMap = loadBrandSettings();

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
  const brandTemplateMap = loadBrandSettings();

  if (!brand) {
    return brandTemplateMap.default;
  }

  return brandTemplateMap[brand] || brandTemplateMap.default;
}
