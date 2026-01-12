import Mailjet from 'node-mailjet';
import { IEmailProvider, EmailOptions } from '../types';

/**
 * Mailjet Email Provider
 *
 * Documentation: https://dev.mailjet.com/email/guides/
 */
export class MailjetProvider implements IEmailProvider {
  private client: Mailjet;
  private defaultFromEmail: string;
  private defaultFromName: string;

  constructor() {
    const apiKey = process.env.MAILJET_API_KEY;
    const apiSecret = process.env.MAILJET_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('MAILJET_API_KEY and MAILJET_API_SECRET must be set');
    }

    this.client = new Mailjet({
      apiKey,
      apiSecret,
    });

    this.defaultFromEmail = process.env.MAILJET_FROM_EMAIL || 'noreply@yourdomain.com';
    this.defaultFromName = process.env.MAILJET_FROM_NAME || 'Newsletter System';
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    const messages = recipients.map((recipient) => ({
      From: {
        Email: options.from || this.defaultFromEmail,
        Name: options.fromName || this.defaultFromName,
      },
      To: [
        {
          Email: recipient,
        },
      ],
      Subject: options.subject,
      HTMLPart: options.htmlBody,
      ...(options.textBody && { TextPart: options.textBody }),
    }));

    try {
      await this.client.post('send', { version: 'v3.1' }).request({
        Messages: messages,
      });
    } catch (error) {
      console.error('Mailjet send error:', error);
      throw new Error(
        `Failed to send email via Mailjet: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async sendBatch(emails: EmailOptions[]): Promise<void> {
    const messages = emails.flatMap((email) => {
      const recipients = Array.isArray(email.to) ? email.to : [email.to];
      return recipients.map((recipient) => ({
        From: {
          Email: email.from || this.defaultFromEmail,
          Name: email.fromName || this.defaultFromName,
        },
        To: [
          {
            Email: recipient,
          },
        ],
        Subject: email.subject,
        HTMLPart: email.htmlBody,
        ...(email.textBody && { TextPart: email.textBody }),
      }));
    });

    try {
      await this.client.post('send', { version: 'v3.1' }).request({
        Messages: messages,
      });
    } catch (error) {
      console.error('Mailjet batch send error:', error);
      throw new Error(
        `Failed to send batch emails via Mailjet: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
