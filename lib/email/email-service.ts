import { IEmailProvider, EmailProviderType, EmailOptions, CampaignOptions, CampaignResult } from './types';
import { MailjetProvider } from './providers/mailjet';
import { SESProvider } from './providers/ses';
import { MailWizzProvider } from './providers/mailwizz';

/**
 * Email Service Factory
 *
 * Automatically selects the email provider based on EMAIL_PROVIDER env variable.
 * Defaults to 'mailjet' if not specified.
 *
 * To switch providers, simply change the EMAIL_PROVIDER environment variable:
 * - mailjet: Use Mailjet
 * - ses: Use AWS SES
 * - sendgrid: Use SendGrid (implement provider first)
 * - resend: Use Resend (implement provider first)
 */
class EmailService {
  private static instance: EmailService | null = null;
  private provider: IEmailProvider | null = null;

  private constructor() {
    // Lazy initialization - provider will be created on first use
  }

  private getProvider(): IEmailProvider {
    if (!this.provider) {
      const providerType = (process.env.EMAIL_PROVIDER || 'mailjet') as EmailProviderType;
      this.provider = this.createProvider(providerType);
    }
    return this.provider;
  }

  private createProvider(type: EmailProviderType): IEmailProvider {
    switch (type) {
      case 'mailjet':
        return new MailjetProvider();
      case 'mailwizz':
        return new MailWizzProvider();
      case 'ses':
        return new SESProvider();
      case 'sendgrid':
        throw new Error('SendGrid provider not implemented yet');
      case 'resend':
        throw new Error('Resend provider not implemented yet');
      default:
        throw new Error(`Unknown email provider: ${type}`);
    }
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send a single email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    return this.getProvider().sendEmail(options);
  }

  /**
   * Send multiple emails in batch
   */
  async sendBatch(emails: EmailOptions[]): Promise<void> {
    return this.getProvider().sendBatch(emails);
  }

  /**
   * Send a newsletter preview email
   */
  async sendNewsletterPreview(
    recipientEmail: string,
    subject: string,
    htmlContent: string
  ): Promise<void> {
    return this.sendEmail({
      to: recipientEmail,
      subject: `[PREVIEW] ${subject}`,
      htmlBody: htmlContent,
    });
  }

  /**
   * Send newsletter to multiple recipients
   */
  async sendNewsletter(
    recipients: string[],
    subject: string,
    htmlContent: string,
    textContent?: string
  ): Promise<void> {
    // For large recipient lists, consider batching
    const batchSize = 50; // Adjust based on provider limits

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const emails = batch.map((recipient) => ({
        to: recipient,
        subject,
        htmlBody: htmlContent,
        textBody: textContent,
      }));

      await this.sendBatch(emails);
    }
  }

  /**
   * Create and schedule a campaign for a mailing list
   * Uses provider's Campaign API (Mailjet/MailWizz)
   */
  async createAndScheduleCampaign(options: CampaignOptions): Promise<CampaignResult> {
    const provider = this.getProvider();

    if (!provider.createAndScheduleCampaign) {
      throw new Error(
        `Campaign scheduling not supported by provider: ${process.env.EMAIL_PROVIDER}`
      );
    }

    return provider.createAndScheduleCampaign(options);
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();

// Export for testing or custom usage
export { EmailService };
