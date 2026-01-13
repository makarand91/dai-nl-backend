import Mailjet from 'node-mailjet';
import { IEmailProvider, EmailOptions, CampaignOptions, CampaignResult } from '../types';

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

  /**
   * Create and schedule a campaign for a Mailjet contact list
   * Uses Mailjet Campaign API v3
   */
  async createAndScheduleCampaign(options: CampaignOptions): Promise<CampaignResult> {
    // Validate sender email upfront (needed in catch block too)
    const senderEmail = options.from || this.defaultFromEmail;
    if (!senderEmail) {
      throw new Error(
        'Sender email is required. Set MAILJET_FROM_EMAIL in your environment variables.'
      );
    }

    try {
      // Mailjet requires ContactsListID to be an integer
      const listIdInt = parseInt(options.listId, 10);
      if (isNaN(listIdInt)) {
        throw new Error(
          `Invalid Mailjet list ID: "${options.listId}". Mailjet requires a numeric Contact List ID (e.g., "123456"). ` +
          `Find your list ID at: https://app.mailjet.com/contacts/lists`
        );
      }
      console.log('Creating Mailjet campaign with sender:', senderEmail);
      console.log('List ID (parsed):', listIdInt);
      console.log('Subject:', options.subject);

      // Step 1: Create campaign draft
      const campaignPayload = {
        Locale: 'en_US',
        Sender: senderEmail,
        SenderName: options.fromName || this.defaultFromName,
        Subject: options.subject,
        ContactsListID: listIdInt,
        Title: options.campaignName || `Campaign - ${options.subject}`,
      };

      console.log('Sending campaign draft request:', JSON.stringify(campaignPayload, null, 2));

      const draftResponse: any = await this.client
        .post('campaigndraft', { version: 'v3' })
        .request(campaignPayload);

      const campaignId = draftResponse.body.Data[0].ID;

      // Step 2: Set campaign content
      await this.client
        .post(`campaigndraft/${campaignId}/detailcontent`, { version: 'v3' })
        .request({
          'Html-part': options.htmlBody,
          ...(options.textBody && { 'Text-part': options.textBody }),
        });

      // Step 3: Schedule or send immediately
      if (options.scheduleAt && options.scheduleAt > new Date()) {
        // Schedule for future
        await this.client
          .post(`campaigndraft/${campaignId}/schedule`, { version: 'v3' })
          .request({
            Date: options.scheduleAt.toISOString(),
          });

        return {
          campaignId: String(campaignId),
          status: 'scheduled',
          message: `Campaign scheduled for ${options.scheduleAt.toISOString()}`,
        };
      } else {
        // Send immediately
        await this.client
          .post(`campaigndraft/${campaignId}/send`, { version: 'v3' })
          .request({});

        return {
          campaignId: String(campaignId),
          status: 'sent',
          message: 'Campaign sent immediately',
        };
      }
    } catch (error: any) {
      console.error('Mailjet campaign error:', error);

      // Log detailed error information for debugging
      if (error.response?.body) {
        console.error('Mailjet API Response:', JSON.stringify(error.response.body, null, 2));
      }

      // Provide helpful error messages for common issues
      const errorMessage = error.ErrorMessage || error.response?.body?.ErrorMessage || error.message || 'Unknown error';
      const statusCode = error.statusCode || error.response?.statusCode;

      if (errorMessage.includes('valid and active sender')) {
        throw new Error(
          `Sender email verification required. The email address "${senderEmail}" must be verified in Mailjet. ` +
          `Possible causes:\n` +
          `1. Email not added to Mailjet senders: https://app.mailjet.com/account/sender\n` +
          `2. Email status is not "Active" (might be pending validation)\n` +
          `3. Domain SPF/DKIM records not configured properly\n` +
          `4. API key doesn't have permission for campaign sending\n` +
          `\nMailjet Error (${statusCode}): ${errorMessage}`
        );
      }

      throw new Error(`Failed to create/schedule campaign: ${errorMessage}`);
    }
  }
}
