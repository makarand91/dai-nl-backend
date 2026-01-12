# Newsletter Management System

A comprehensive newsletter management backend application built with Next.js, AWS services, and Strapi CMS. This system allows you to create, preview, schedule, and send newsletters with full tracking and history.

## Features

- **Strapi CMS Integration**: Fetch newsletter content directly from Strapi CMS
- **Newsletter Preview**: Create and preview newsletters before sending
- **Preview Emails**: Send test emails to verify newsletter appearance
- **Scheduling**: Schedule newsletters for future delivery
- **AWS S3 Storage**: Store newsletter HTML for browser-based viewing
- **DynamoDB History**: Track all newsletter actions and maintain complete history
- **Cognito Authentication**: Secure access with AWS Cognito SSO
- **Responsive UI**: Modern, responsive interface built with Tailwind CSS
- **Modular Email System**: Switch between email providers (Mailjet, SES, etc.) with one config change

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Authentication**: NextAuth.js with AWS Cognito
- **Cloud Services**: AWS S3 (storage), DynamoDB (database), Cognito (auth)
- **Email Providers**: Mailjet (default), AWS SES, or easily add others
- **CMS**: Strapi
- **Language**: TypeScript

## Project Structure

```
dai-nl-backend/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth authentication
│   │   └── newsletter/
│   │       ├── preview/           # Preview newsletter API
│   │       ├── send-preview/      # Send preview email API
│   │       ├── schedule/          # Schedule newsletter API
│   │       ├── history/           # Newsletter history API
│   │       └── route.ts           # List newsletters API
│   ├── newsletter/[id]/           # Newsletter detail page
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Dashboard page
├── components/
│   ├── newsletter/
│   │   ├── NewsletterList.tsx     # Newsletter list component
│   │   └── CreateNewsletterForm.tsx # Create newsletter form
│   └── SessionProvider.tsx        # Auth session provider
├── lib/
│   ├── aws/
│   │   ├── s3-client.ts          # S3 operations
│   │   ├── dynamodb-client.ts    # DynamoDB operations
│   │   └── ses-client.ts         # Legacy SES (use lib/email instead)
│   ├── email/
│   │   ├── email-service.ts      # Email service factory
│   │   ├── types.ts              # Email types
│   │   ├── providers/
│   │   │   ├── mailjet.ts        # Mailjet provider
│   │   │   └── ses.ts            # AWS SES provider
│   │   └── ADDING_PROVIDERS.md   # Guide to add providers
│   ├── auth/
│   │   └── auth-config.ts        # NextAuth configuration
│   ├── types/
│   │   └── newsletter.ts         # TypeScript types
│   └── utils/
│       └── strapi-client.ts      # Strapi integration
└── .env.example                  # Environment variables template
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- AWS Account with access to S3, DynamoDB, SES, and Cognito
- Strapi CMS instance (optional)

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update the environment variables with your AWS and Strapi credentials.

### 3. AWS Setup

#### Create S3 Bucket

```bash
aws s3 mb s3://newsletter-storage --region us-east-1
```

#### Create DynamoDB Tables

**Newsletters Table:**
```bash
aws dynamodb create-table \
  --table-name newsletters \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

**Newsletter History Table:**
```bash
aws dynamodb create-table \
  --table-name newsletter-history \
  --attribute-definitions \
    AttributeName=newsletterId,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=newsletterId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

#### Configure SES

1. Verify your sender email in AWS SES
2. If in sandbox mode, verify recipient emails
3. Request production access for sending to any email

#### Set Up Cognito

1. Create a User Pool in AWS Cognito
2. Create an App Client with PKCE enabled
3. Configure callback URLs (e.g., `http://localhost:3000/api/auth/callback/cognito`)
4. Note the User Pool ID, Client ID, and Client Secret

### 4. Configure Email Provider

The application uses a modular email system. Choose your preferred provider:

#### Option A: Mailjet (Recommended - Default)

1. Sign up at [Mailjet](https://www.mailjet.com/)
2. Get your API Key and Secret Key from the dashboard
3. Verify your sender email/domain
4. Add to `.env.local`:
   ```env
   EMAIL_PROVIDER=mailjet
   MAILJET_API_KEY=your-api-key
   MAILJET_API_SECRET=your-api-secret
   MAILJET_FROM_EMAIL=noreply@yourdomain.com
   MAILJET_FROM_NAME=Newsletter System
   ```

#### Option B: AWS SES

1. Verify your sender email in AWS SES console
2. If in sandbox mode, verify recipient emails
3. Request production access for unrestricted sending
4. Add to `.env.local`:
   ```env
   EMAIL_PROVIDER=ses
   SES_FROM_EMAIL=noreply@yourdomain.com
   SES_REGION=us-east-1
   ```

#### Option C: Add Your Own Provider

See `lib/email/ADDING_PROVIDERS.md` for a complete guide on adding SendGrid, Resend, Postmark, or any other email service.

**Switching Providers**: Simply change the `EMAIL_PROVIDER` environment variable and update the corresponding credentials. No code changes needed!

### 5. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Add this to your `.env.local` as `NEXTAUTH_SECRET`.

### 6. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### Newsletters
- `GET /api/newsletter` - List all newsletters
- `GET /api/newsletter?id={id}` - Get specific newsletter
- `POST /api/newsletter/preview` - Create newsletter preview
- `POST /api/newsletter/send-preview` - Send preview email
- `POST /api/newsletter/schedule` - Schedule newsletter
- `PUT /api/newsletter/schedule` - Send scheduled newsletter
- `GET /api/newsletter/history?newsletterId={id}` - Get newsletter history

## Usage

### Creating a Newsletter

1. **From Strapi**: Enter the Strapi content ID to auto-fetch content
2. **Manual**: Enter title, subject, and HTML content directly

### Previewing

- After creation, newsletters are automatically saved to S3
- Click "View in Browser" to see the newsletter in a new tab

### Sending Preview Emails

- Navigate to the newsletter detail page
- Enter recipient email address
- Click "Send Preview"

### Scheduling

- Set a future date/time
- Click "Schedule Newsletter"
- The newsletter status will update to "scheduled"

### History Tracking

All actions are tracked in DynamoDB:
- Newsletter creation
- Preview generation
- Preview emails sent
- Newsletter scheduling
- Newsletter sending
- Failures

## DynamoDB Schema

### Newsletters Table

```
Table Name: newsletters
Primary Key: id (String)

Attributes:
- id: String (Primary Key)
- title: String
- subject: String
- htmlContent: String
- textContent: String (Optional)
- strapiContentId: String (Optional)
- status: String (draft|scheduled|sent|failed)
- scheduledFor: String (ISO 8601)
- sentAt: String (ISO 8601)
- s3Key: String
- s3Url: String
- createdAt: String (ISO 8601)
- updatedAt: String (ISO 8601)
```

### Newsletter History Table

```
Table Name: newsletter-history
Primary Key: newsletterId (String)
Sort Key: timestamp (String)

Attributes:
- id: String
- newsletterId: String (Primary Key)
- timestamp: String (Sort Key, ISO 8601)
- action: String (created|previewed|preview_sent|scheduled|sent|failed)
- metadata: Map
- userId: String
```

## AWS IAM Permissions Required

Your AWS IAM user/role needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::newsletter-storage/*",
        "arn:aws:s3:::newsletter-storage"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/newsletters",
        "arn:aws:dynamodb:*:*:table/newsletter-history"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

## Production Considerations

### Email Sending

The current implementation sends emails one at a time. For production:

1. **Use SES Templates**: Create reusable email templates
2. **Batch Sending**: Implement batch processing for large recipient lists
3. **Queue System**: Use SQS for reliable email delivery
4. **Rate Limiting**: Respect SES sending limits

### Scheduling

The current implementation marks newsletters as scheduled but doesn't automatically send them. For production:

1. **AWS EventBridge**: Create scheduled rules to trigger sending
2. **Lambda Functions**: Process scheduled newsletters
3. **Step Functions**: Orchestrate complex workflows

### Security

1. **Environment Variables**: Never commit `.env.local` to version control
2. **IAM Roles**: Use least-privilege IAM roles
3. **API Rate Limiting**: Implement rate limiting on API routes
4. **Input Validation**: Add comprehensive input validation
5. **CORS**: Configure appropriate CORS policies

## Deployment

### Vercel (Recommended)

```bash
npm run build
vercel --prod
```

Ensure environment variables are configured in Vercel dashboard.

### AWS Amplify

1. Connect your Git repository
2. Configure build settings
3. Add environment variables
4. Deploy

## Troubleshooting

### SES Emails Not Sending

- Verify sender email in SES console
- Check SES sandbox status
- Verify recipient emails if in sandbox mode
- Check CloudWatch logs for errors

### DynamoDB Access Denied

- Verify IAM credentials
- Check IAM policy permissions
- Ensure table names match environment variables

### Cognito Authentication Fails

- Verify callback URLs are configured
- Check User Pool and App Client settings
- Ensure NEXTAUTH_SECRET is set
- Verify COGNITO_ISSUER format

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Strapi Documentation](https://docs.strapi.io/)

## License

MIT
