/**
 * Initialize Brand Settings in DynamoDB
 *
 * This script:
 * 1. Creates the newsletter-settings DynamoDB table if it doesn't exist
 * 2. Migrates data from data/brand-settings.json if it exists
 * 3. Otherwise initializes with default settings
 *
 * Run with: npx tsx scripts/init-settings-dynamodb.ts
 */

import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { initializeBrandSettings, saveBrandSettingsToDynamoDB } from '../lib/aws/dynamodb-settings';
import { BrandSettings } from '../lib/settings/brand-settings';
import * as fs from 'fs';
import * as path from 'path';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const TABLE_NAME = process.env.DYNAMODB_SETTINGS_TABLE || 'newsletter-settings';

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

async function createSettingsTable(): Promise<void> {
  console.log(`Creating DynamoDB table: ${TABLE_NAME}...`);

  const command = new CreateTableCommand({
    TableName: TABLE_NAME,
    KeySchema: [
      { AttributeName: 'pk', KeyType: 'HASH' },
      { AttributeName: 'sk', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'pk', AttributeType: 'S' },
      { AttributeName: 'sk', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  });

  await dynamoClient.send(command);
  console.log(`✓ Table ${TABLE_NAME} created successfully`);

  // Wait for table to become active
  console.log('Waiting for table to become active...');
  let isActive = false;
  while (!isActive) {
    const response = await dynamoClient.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    isActive = response.Table?.TableStatus === 'ACTIVE';
    if (!isActive) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  console.log('✓ Table is active');
}

async function migrateFromJsonFile(): Promise<boolean> {
  const jsonFilePath = path.join(process.cwd(), 'data', 'brand-settings.json');

  if (!fs.existsSync(jsonFilePath)) {
    console.log('No JSON file found at data/brand-settings.json');
    return false;
  }

  console.log('Found existing JSON file, migrating data...');

  try {
    const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
    const settings: Record<string, BrandSettings> = JSON.parse(fileContent);

    await saveBrandSettingsToDynamoDB(settings);
    console.log('✓ Successfully migrated settings from JSON file');
    console.log(`  Migrated ${Object.keys(settings).length} brand(s)`);

    // Optionally rename the file to indicate it's been migrated
    const backupPath = jsonFilePath + '.migrated';
    fs.renameSync(jsonFilePath, backupPath);
    console.log(`✓ Original JSON file backed up to: ${backupPath}`);

    return true;
  } catch (error) {
    console.error('Error migrating from JSON file:', error);
    return false;
  }
}

async function main() {
  console.log('=== Brand Settings DynamoDB Initialization ===\n');

  try {
    // Step 1: Check if table exists
    const exists = await tableExists(TABLE_NAME);

    if (!exists) {
      await createSettingsTable();
    } else {
      console.log(`✓ Table ${TABLE_NAME} already exists`);
    }

    // Step 2: Try to migrate from JSON file
    const migrated = await migrateFromJsonFile();

    // Step 3: If no migration, initialize with defaults
    if (!migrated) {
      console.log('Initializing with default brand settings...');
      await initializeBrandSettings();
      console.log('✓ Default brand settings initialized');
    }

    console.log('\n=== Initialization Complete ===');
    console.log('\nNext steps:');
    console.log('1. Update your .env file with:');
    console.log(`   DYNAMODB_SETTINGS_TABLE=${TABLE_NAME}`);
    console.log('2. Start your application');
    console.log('3. Go to /settings/brands to manage brand templates\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during initialization:', error);
    process.exit(1);
  }
}

main();
