/**
 * DynamoDB Settings Storage
 *
 * Stores application settings in DynamoDB for better scalability and AWS integration
 */

import { dynamoDb } from './dynamodb-client';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const SETTINGS_TABLE = process.env.DYNAMODB_SETTINGS_TABLE || 'newsletter-settings';
const BRAND_SETTINGS_KEY = 'BRAND_SETTINGS';

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

interface BrandSettingsItem {
  pk: string;
  sk: string;
  data: Record<string, BrandSettings>;
  updatedAt: string;
}

/**
 * Load brand settings from DynamoDB
 */
export async function loadBrandSettingsFromDynamoDB(): Promise<Record<string, BrandSettings>> {
  try {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: SETTINGS_TABLE,
        Key: {
          pk: BRAND_SETTINGS_KEY,
          sk: 'CONFIG',
        },
      })
    );

    if (result.Item) {
      return (result.Item as BrandSettingsItem).data;
    }

    // Return default if not found
    return getDefaultBrandSettings();
  } catch (error) {
    console.error('Error loading brand settings from DynamoDB:', error);
    return getDefaultBrandSettings();
  }
}

/**
 * Save brand settings to DynamoDB
 */
export async function saveBrandSettingsToDynamoDB(
  settings: Record<string, BrandSettings>
): Promise<void> {
  try {
    const item: BrandSettingsItem = {
      pk: BRAND_SETTINGS_KEY,
      sk: 'CONFIG',
      data: settings,
      updatedAt: new Date().toISOString(),
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: SETTINGS_TABLE,
        Item: item,
      })
    );
  } catch (error) {
    console.error('Error saving brand settings to DynamoDB:', error);
    throw new Error('Failed to save brand settings to DynamoDB');
  }
}

/**
 * Get default brand settings (fallback)
 */
function getDefaultBrandSettings(): Record<string, BrandSettings> {
  return {
    default: {
      templateId: 'default',
    },
  };
}

/**
 * Initialize brand settings table with default data (run once)
 */
export async function initializeBrandSettings(): Promise<void> {
  try {
    // Check if settings already exist
    const existing = await dynamoDb.send(
      new GetCommand({
        TableName: SETTINGS_TABLE,
        Key: {
          pk: BRAND_SETTINGS_KEY,
          sk: 'CONFIG',
        },
      })
    );

    // Only initialize if no settings exist
    if (!existing.Item) {
      const defaultSettings: Record<string, BrandSettings> = {
        default: {
          templateId: 'default',
        },
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
      };

      await saveBrandSettingsToDynamoDB(defaultSettings);
      console.log('Brand settings initialized in DynamoDB');
    }
  } catch (error) {
    console.error('Error initializing brand settings:', error);
    throw error;
  }
}
