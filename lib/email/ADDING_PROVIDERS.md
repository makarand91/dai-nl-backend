# Adding New Email Providers

This guide explains how to add support for new email providers to the newsletter system.

## Current Supported Providers

- **Mailjet** (default) - Full support
- **AWS SES** - Full support
- **SendGrid** - Not yet implemented
- **Resend** - Not yet implemented

## How to Add a New Provider

### Step 1: Install the Provider's SDK

```bash
npm install provider-sdk-name
```

### Step 2: Create a Provider Class

Create a new file in `lib/email/providers/` (e.g., `sendgrid.ts`):

```typescript
import { IEmailProvider, EmailOptions } from '../types';
import sendgrid from '@sendgrid/mail'; // example

export class SendGridProvider implements IEmailProvider {
  private defaultFromEmail: string;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY must be set');
    }

    sendgrid.setApiKey(apiKey);
    this.defaultFromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com';
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    const message = {
      to: recipients,
      from: options.from || this.defaultFromEmail,
      subject: options.subject,
      html: options.htmlBody,
      text: options.textBody,
    };

    try {
      await sendgrid.send(message);
    } catch (error) {
      console.error('SendGrid send error:', error);
      throw new Error(`Failed to send email via SendGrid: ${error.message}`);
    }
  }

  async sendBatch(emails: EmailOptions[]): Promise<void> {
    // Implement batch sending according to provider's API
    for (const email of emails) {
      await this.sendEmail(email);
    }
  }
}
```

### Step 3: Register the Provider

Add your provider to `lib/email/email-service.ts`:

```typescript
// Import your provider
import { SendGridProvider } from './providers/sendgrid';

// Update the EmailProviderType in types.ts
export type EmailProviderType = 'mailjet' | 'ses' | 'sendgrid' | 'resend';

// Add to createProvider method
private createProvider(type: EmailProviderType): IEmailProvider {
  switch (type) {
    case 'mailjet':
      return new MailjetProvider();
    case 'ses':
      return new SESProvider();
    case 'sendgrid':
      return new SendGridProvider(); // Add this
    case 'resend':
      throw new Error('Resend provider not implemented yet');
    default:
      throw new Error(`Unknown email provider: ${type}`);
  }
}
```

### Step 4: Export from Index

Add to `lib/email/index.ts`:

```typescript
export { SendGridProvider } from './providers/sendgrid';
```

### Step 5: Update Environment Configuration

Add provider configuration to `.env.example`:

```env
# SendGrid Configuration (if using EMAIL_PROVIDER=sendgrid)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Step 6: Update Documentation

Update the README.md with information about the new provider.

## Testing Your Provider

1. Set the environment variable:
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=your-api-key
   SENDGRID_FROM_EMAIL=verified@email.com
   ```

2. Test with a preview email:
   - Create a newsletter
   - Send a preview email to yourself
   - Verify the email is received

3. Test batch sending:
   - Schedule a newsletter
   - Trigger the send to multiple recipients
   - Verify all emails are delivered

## Provider Interface Requirements

Your provider class must implement the `IEmailProvider` interface:

```typescript
interface IEmailProvider {
  sendEmail(options: EmailOptions): Promise<void>;
  sendBatch(emails: EmailOptions[]): Promise<void>;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
  fromName?: string;
}
```

## Best Practices

1. **Error Handling**: Always wrap provider API calls in try-catch and throw descriptive errors
2. **Logging**: Log errors with provider-specific details for debugging
3. **Rate Limiting**: Respect the provider's rate limits in `sendBatch`
4. **Configuration Validation**: Validate required environment variables in constructor
5. **Batch Size**: Implement appropriate batch sizes based on provider limits
6. **Async/Await**: Use async/await for all API calls
7. **Retries**: Consider implementing retry logic for transient failures

## Common Providers

### Mailjet
- Docs: https://dev.mailjet.com/
- SDK: `node-mailjet`
- ✅ Implemented

### AWS SES
- Docs: https://docs.aws.amazon.com/ses/
- SDK: `@aws-sdk/client-ses`
- ✅ Implemented

### SendGrid
- Docs: https://docs.sendgrid.com/
- SDK: `@sendgrid/mail`
- ❌ Not implemented

### Resend
- Docs: https://resend.com/docs
- SDK: `resend`
- ❌ Not implemented

### Postmark
- Docs: https://postmarkapp.com/developer
- SDK: `postmark`
- ❌ Not implemented

## Switching Providers

To switch from one provider to another:

1. Install the new provider's dependencies
2. Update `.env.local`:
   ```env
   EMAIL_PROVIDER=new-provider
   ```
3. Add the required API keys/credentials
4. Restart your application
5. Test sending emails

No code changes required - the factory pattern handles provider selection automatically!
