/**
 * Test Mailjet Credentials
 *
 * Run this script to verify your Mailjet API credentials are correct:
 * npx tsx scripts/test-mailjet.ts
 */

import Mailjet from 'node-mailjet';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testMailjetCredentials() {
  console.log('=== Mailjet Credentials Test ===\n');

  // Check if credentials exist
  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_API_SECRET;
  const fromEmail = process.env.MAILJET_FROM_EMAIL;

  console.log('1. Checking environment variables...');
  console.log(`   MAILJET_API_KEY: ${apiKey ? '✓ Set (length: ' + apiKey.length + ')' : '✗ Missing'}`);
  console.log(`   MAILJET_API_SECRET: ${apiSecret ? '✓ Set (length: ' + apiSecret.length + ')' : '✗ Missing'}`);
  console.log(`   MAILJET_FROM_EMAIL: ${fromEmail || '✗ Missing'}\n`);

  if (!apiKey || !apiSecret) {
    console.error('❌ Missing Mailjet credentials in .env.local file\n');
    console.log('Please add to .env.local:');
    console.log('  MAILJET_API_KEY=your-api-key');
    console.log('  MAILJET_API_SECRET=your-api-secret');
    console.log('  MAILJET_FROM_EMAIL=noreply@yourdomain.com\n');
    process.exit(1);
  }

  // Check for whitespace issues
  if (apiKey !== apiKey.trim() || apiSecret !== apiSecret.trim()) {
    console.warn('⚠️  Warning: Credentials have leading/trailing whitespace!\n');
  }

  // Test API connection
  console.log('2. Testing Mailjet API connection...');

  try {
    const mailjet = new Mailjet({
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
    });

    // Try to get account information (simple API test)
    const result = await mailjet
      .get('user')
      .request();

    console.log('✓ API Connection successful!\n');
    console.log('3. Account Information:');
    console.log(`   Email: ${result.body.Data[0].Email}`);
    console.log(`   Username: ${result.body.Data[0].Username}\n`);

    console.log('✅ Mailjet credentials are valid!\n');
    console.log('If you still get 401 errors in your app:');
    console.log('1. Restart your dev server: npm run dev');
    console.log('2. Clear any caches');
    console.log('3. Check that .env.local is in the project root\n');

  } catch (error: any) {
    console.error('❌ API Connection failed!\n');

    if (error.statusCode === 401) {
      console.error('Authentication Error (401):');
      console.error('- Your API Key or Secret is incorrect');
      console.error('- Get your credentials from: https://app.mailjet.com/account/api_keys');
      console.error('- Make sure you\'re using the API Key (NOT the "Public Key")');
      console.error('- Make sure you\'re using the Secret Key (NOT the "Private Key")\n');
      console.error('Mailjet API Keys have this format:');
      console.error('  API Key: 32 characters (alphanumeric)');
      console.error('  Secret Key: 32 characters (alphanumeric)\n');
    } else if (error.statusCode === 403) {
      console.error('Authorization Error (403):');
      console.error('- Your account may not have permission to use the API');
      console.error('- Check your Mailjet account status\n');
    } else {
      console.error('Error details:', error.message);
      if (error.response) {
        console.error('Response:', error.response.body);
      }
    }

    process.exit(1);
  }
}

testMailjetCredentials();
