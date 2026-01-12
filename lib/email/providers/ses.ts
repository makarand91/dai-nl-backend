import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { IEmailProvider, EmailOptions } from '../types';

/**
 * AWS SES Email Provider
 *
 * Documentation: https://docs.aws.amazon.com/ses/
 */
export class SESProvider implements IEmailProvider {
  private client: SESClient;
  private defaultFromEmail: string;

  constructor() {
    this.client = new SESClient({
      region: process.env.SES_REGION || process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    this.defaultFromEmail = process.env.SES_FROM_EMAIL || 'noreply@yourdomain.com';
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const fromAddress = options.from || this.defaultFromEmail;

    const command = new SendEmailCommand({
      Source: fromAddress,
      Destination: {
        ToAddresses: recipients,
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: options.htmlBody,
            Charset: 'UTF-8',
          },
          ...(options.textBody && {
            Text: {
              Data: options.textBody,
              Charset: 'UTF-8',
            },
          }),
        },
      },
    });

    try {
      await this.client.send(command);
    } catch (error) {
      console.error('SES send error:', error);
      throw new Error(
        `Failed to send email via SES: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async sendBatch(emails: EmailOptions[]): Promise<void> {
    // SES doesn't have a true batch API, so we send sequentially
    // For production, consider using SES Bulk Email or implement proper batching
    for (const email of emails) {
      await this.sendEmail(email);
    }
  }
}
