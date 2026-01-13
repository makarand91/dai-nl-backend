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

export interface CampaignOptions {
  listId: string;           // Mailjet ContactsList ID or MailWizz List UID
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
  fromName?: string;
  campaignName?: string;    // Campaign name/title
  scheduleAt?: Date;        // When to send (optional, defaults to immediate)
}

export interface CampaignResult {
  campaignId: string;       // Provider's campaign ID
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  message?: string;
}

export interface IEmailProvider {
  // Direct sending (for preview emails)
  sendEmail(options: EmailOptions): Promise<void>;
  sendBatch(emails: EmailOptions[]): Promise<void>;

  // Campaign operations (for scheduled sends to lists)
  createAndScheduleCampaign?(options: CampaignOptions): Promise<CampaignResult>;
}

export type EmailProviderType = 'mailjet' | 'mailwizz' | 'ses' | 'sendgrid' | 'resend';
