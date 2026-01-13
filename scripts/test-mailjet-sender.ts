/**
 * Test Mailjet Sender Configuration
 * This script checks which senders are verified in your Mailjet account
 */

import Mailjet from 'node-mailjet';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testMailjetSenders() {
  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_API_SECRET;

  console.log('=== Mailjet Sender Configuration Test ===\n');
  console.log('Checking environment variables...');
  console.log(`MAILJET_API_KEY: ${apiKey ? '✓ Set' : '✗ Missing'}`);
  console.log(`MAILJET_API_SECRET: ${apiSecret ? '✓ Set (length: ' + apiSecret?.length + ')' : '✗ Missing'}`);
  console.log(`MAILJET_FROM_EMAIL: ${process.env.MAILJET_FROM_EMAIL || '(not set)'}`);
  console.log(`MAILJET_FROM_NAME: ${process.env.MAILJET_FROM_NAME || '(not set)'}`);
  console.log();

  if (!apiKey || !apiSecret) {
    console.error('❌ Missing Mailjet credentials in .env.local file');
    process.exit(1);
  }

  const mailjet = new Mailjet({
    apiKey: apiKey.trim(),
    apiSecret: apiSecret.trim(),
  });

  try {
    // Test 1: Check API connection
    console.log('Test 1: Checking API connection...');
    const userResult: any = await mailjet.get('user').request();
    console.log(`✓ API Connection successful!`);
    console.log(`  Account Email: ${userResult.body.Data[0].Email}`);
    console.log(`  Username: ${userResult.body.Data[0].Username}`);
    console.log();

    // Test 2: List all verified senders
    console.log('Test 2: Listing verified senders...');
    try {
      const sendersResult: any = await mailjet
        .get('sender', { version: 'v3' })
        .request();

      if (sendersResult.body.Data && sendersResult.body.Data.length > 0) {
        console.log(`✓ Found ${sendersResult.body.Data.length} sender(s):\n`);
        sendersResult.body.Data.forEach((sender: any, index: number) => {
          console.log(`  ${index + 1}. ${sender.Email || sender.EmailAddress}`);
          console.log(`     Status: ${sender.Status}`);
          console.log(`     Name: ${sender.Name || '(not set)'}`);
          if (sender.DNSID) {
            console.log(`     DNS/Domain ID: ${sender.DNSID}`);
          }
          console.log();
        });

        // Check if the target email is in the list
        const targetEmail = 'marketing@dg01.amplfiye.com';
        const foundSender = sendersResult.body.Data.find(
          (s: any) => (s.Email || s.EmailAddress) === targetEmail
        );

        if (foundSender) {
          console.log(`✓ Target email "${targetEmail}" FOUND in verified senders!`);
          console.log(`  Status: ${foundSender.Status}`);
          if (foundSender.Status !== 'Active') {
            console.log(`  ⚠️  WARNING: Status is not "Active" - this may cause issues`);
          }
        } else {
          console.log(`✗ Target email "${targetEmail}" NOT FOUND in verified senders`);
          console.log(`  This is likely why the campaign creation is failing.`);
        }
      } else {
        console.log('✗ No verified senders found in your Mailjet account');
        console.log('  Go to https://app.mailjet.com/account/sender to add one');
      }
    } catch (senderError: any) {
      console.error('✗ Error fetching senders:', senderError.message);
      console.log('  This might be an API permission issue');
    }
    console.log();

    // Test 3: Check domain authentication (if available)
    console.log('Test 3: Checking domain authentication...');
    try {
      const domainsResult: any = await mailjet
        .get('dns', { version: 'v3' })
        .request();

      if (domainsResult.body.Data && domainsResult.body.Data.length > 0) {
        console.log(`✓ Found ${domainsResult.body.Data.length} domain(s):\n`);
        domainsResult.body.Data.forEach((domain: any, index: number) => {
          console.log(`  ${index + 1}. ${domain.Domain}`);
          console.log(`     SPF Status: ${domain.SPFStatus || 'Not configured'}`);
          console.log(`     DKIM Status: ${domain.DKIMStatus || 'Not configured'}`);
          console.log();
        });
      } else {
        console.log('  No domains configured for authentication');
        console.log('  Consider setting up SPF/DKIM at: https://app.mailjet.com/account/sender');
      }
    } catch (domainError: any) {
      console.log('  Could not fetch domain info (this is optional)');
    }
    console.log();

    console.log('=== Recommendations ===');
    console.log('1. Make sure the sender email is in the "Active" status');
    console.log('2. If using a custom domain, verify SPF and DKIM records');
    console.log('3. Try using the exact email address shown in the Mailjet dashboard');
    console.log('4. Ensure your API key has permission to create campaigns');
    console.log();

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.statusCode === 401) {
      console.error('   Authentication failed - check your API credentials');
    }
    process.exit(1);
  }
}

testMailjetSenders().catch(console.error);
