/**
 * Brand to Template Mapping Configuration
 *
 * This file maps brand identifiers to newsletter templates.
 * Brand mappings are stored in DynamoDB for better scalability and AWS integration.
 */

import {
  loadBrandSettingsFromDynamoDB,
  saveBrandSettingsToDynamoDB,
} from '../aws/dynamodb-settings';

export interface BrandSettings {
  templateId: string;
  defaultSubject?: string;
  // Email provider for this brand (mailjet or mailwizz)
  emailProvider?: 'mailjet' | 'mailwizz';
  // Mailing list ID for Mailjet/MailWizz
  listId?: string;
  // Campaign ID for tracking
  campaignId?: string;
  customization?: {
    primaryColor?: string;
    logo?: string;
    [key: string]: any;
  };
}

// In-memory cache with TTL
let cachedSettings: Record<string, BrandSettings> | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL_MS = 60000; // 1 minute cache

/**
 * Load brand settings from DynamoDB (with cache)
 */
export async function loadBrandSettings(): Promise<Record<string, BrandSettings>> {
  const now = Date.now();

  // Return cached settings if still valid
  if (cachedSettings && cacheTimestamp && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSettings;
  }

  try {
    cachedSettings = await loadBrandSettingsFromDynamoDB();
    cacheTimestamp = now;
    return cachedSettings;
  } catch (error) {
    console.error('Error loading brand settings:', error);
    // Return cached settings even if expired, as fallback
    if (cachedSettings) {
      return cachedSettings;
    }
    // Final fallback
    return {
      default: {
        templateId: 'default',
      },
    };
  }
}

/**
 * Save brand settings to DynamoDB
 */
export async function saveBrandSettings(settings: Record<string, BrandSettings>): Promise<void> {
  try {
    await saveBrandSettingsToDynamoDB(settings);
    cachedSettings = settings; // Update cache
    cacheTimestamp = Date.now();
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
  cacheTimestamp = null;
}

/**
 * Get brand template map
 */
export async function getBrandTemplateMap(): Promise<Record<string, BrandSettings>> {
  return await loadBrandSettings();
}

/**
 * Get template ID for a brand
 */
export async function getTemplateForBrand(brand?: string | null): Promise<string> {
  const brandTemplateMap = await loadBrandSettings();

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
export async function getBrandSettings(brand?: string | null): Promise<BrandSettings> {
  const brandTemplateMap = await loadBrandSettings();

  if (!brand) {
    return brandTemplateMap.default;
  }

  return brandTemplateMap[brand] || brandTemplateMap.default;
}
