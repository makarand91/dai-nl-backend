/**
 * Email Service Provider Interface
 *
 * This abstraction allows easy switching between email providers.
 * Simply change the EMAIL_PROVIDER environment variable to switch providers.
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
  fromName?: string;
}

export interface IEmailProvider {
  sendEmail(options: EmailOptions): Promise<void>;
  sendBatch(emails: EmailOptions[]): Promise<void>;
}

export type EmailProviderType = 'mailjet' | 'ses' | 'sendgrid' | 'resend';
