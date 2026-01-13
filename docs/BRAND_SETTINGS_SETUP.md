# Brand Settings - DynamoDB Setup

Brand settings are now stored in DynamoDB instead of JSON files for better scalability, concurrency handling, and AWS integration.

Brand settings include:
- **Template ID**: Which newsletter template to use
- **List ID**: Mailjet/MailWizz mailing list ID for sending
- **Campaign ID**: Campaign identifier for tracking
- **Default Subject**: Optional default email subject
- **Customization**: Colors, logos, etc.

## Table Structure

**Table Name:** `newsletter-settings` (configurable via `DYNAMODB_SETTINGS_TABLE` env variable)

**Primary Keys:**
- `pk` (Partition Key): `BRAND_SETTINGS`
- `sk` (Sort Key): `CONFIG`

**Attributes:**
- `data`: Object containing all brand-to-template mappings
- `updatedAt`: ISO timestamp of last update

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
DYNAMODB_SETTINGS_TABLE=newsletter-settings
AWS_REGION=us-east-1
```

### 3. Initialize DynamoDB Table

Run the initialization script:

```bash
npm run init-settings
```

This script will:
- Create the `newsletter-settings` DynamoDB table
- Migrate data from `data/brand-settings.json` if it exists
- Initialize with default settings if no JSON file found
- Wait for table to become active

### 4. IAM Permissions

Ensure your IAM role/user has these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/newsletter-settings"
    }
  ]
}
```

## Features

### 1. In-Memory Caching
- Settings are cached for 1 minute
- Reduces DynamoDB read costs
- Automatic cache invalidation on updates

### 2. Fallback Strategy
- If DynamoDB is unavailable, uses cached settings
- If no cache, returns default settings
- Ensures application continues to function

### 3. Concurrent Safe
- DynamoDB handles concurrent writes automatically
- No file locking issues
- Works across multiple application instances

## Managing Brand Settings

### Via UI
1. Go to `/settings/brands` in your application
2. Add, edit, or delete brand mappings
3. Click "Save All Changes" to persist to DynamoDB

### Via API
```bash
# Get all brand settings
GET /api/settings/brands

# Update brand settings
POST /api/settings/brands
{
  "brandSettings": {
    "default": { "templateId": "default" },
    "brand-a": { "templateId": "modern" }
  }
}
```

### Programmatically
```typescript
import { loadBrandSettings, saveBrandSettings } from '@/lib/settings/brand-settings';

// Load settings
const settings = await loadBrandSettings();

// Update settings
await saveBrandSettings({
  default: { templateId: 'default' },
  'my-brand': { templateId: 'modern' }
});
```

## Migration from JSON

If you previously used JSON file storage:

1. Your existing `data/brand-settings.json` will be automatically migrated
2. The original file will be backed up to `data/brand-settings.json.migrated`
3. Future updates will be stored in DynamoDB

## Monitoring

### Check Settings in DynamoDB
```bash
aws dynamodb get-item \
  --table-name newsletter-settings \
  --key '{"pk": {"S": "BRAND_SETTINGS"}, "sk": {"S": "CONFIG"}}'
```

### View CloudWatch Metrics
- Monitor read/write capacity
- Track API latency
- Set up alarms for errors

## Costs

DynamoDB uses Pay-Per-Request pricing:
- **Reads**: $0.25 per million requests
- **Writes**: $1.25 per million requests
- **Storage**: $0.25 per GB-month

With caching, typical costs are minimal (< $1/month for most applications).

## Troubleshooting

### Settings Not Loading
1. Check DynamoDB table exists: `aws dynamodb describe-table --table-name newsletter-settings`
2. Verify IAM permissions
3. Check AWS region matches your configuration
4. Review CloudWatch logs for errors

### Table Creation Failed
- Ensure AWS credentials are configured
- Check IAM permissions for `dynamodb:CreateTable`
- Verify table doesn't already exist in another region

### Settings Not Saving
- Check IAM permissions for `dynamodb:PutItem`
- Verify table is in ACTIVE state
- Check network connectivity to DynamoDB

## Best Practices

1. **Use IAM Roles**: Don't hardcode AWS credentials, use IAM roles for EC2/ECS/Lambda
2. **Monitor Costs**: Set up billing alarms in CloudWatch
3. **Backup**: Enable Point-in-Time Recovery for the settings table
4. **Testing**: Use separate DynamoDB tables for dev/staging/production
5. **Cache TTL**: Adjust `CACHE_TTL_MS` in `brand-settings.ts` based on your update frequency
