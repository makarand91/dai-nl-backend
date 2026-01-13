import axios, { AxiosInstance } from 'axios';
import { IEmailProvider, EmailOptions, CampaignOptions, CampaignResult } from '../types';

/**
 * MailWizz Email Provider
 *
 * Documentation: https://api-docs.mailwizz.com/
 *
 * Note: MailWizz is primarily a campaign management system.
 * Direct sending (sendEmail) is not supported - use campaigns instead.
 */
export class MailWizzProvider implements IEmailProvider {
  private client: AxiosInstance;
  private defaultFromEmail: string;
  private defaultFromName: string;

  constructor() {
    const apiUrl = process.env.MAILWIZZ_API_URL;
    const apiKey = process.env.MAILWIZZ_API_KEY;

    if (!apiUrl || !apiKey) {
      throw new Error('MAILWIZZ_API_URL and MAILWIZZ_API_KEY must be set');
    }

    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'X-MW-PUBLIC-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    });

    this.defaultFromEmail = process.env.MAILWIZZ_FROM_EMAIL || 'noreply@yourdomain.com';
    this.defaultFromName = process.env.MAILWIZZ_FROM_NAME || 'Newsletter System';
  }

  /**
   * Direct email sending not supported by MailWizz
   * Use campaigns instead
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    throw new Error(
      'MailWizz does not support direct email sending. Use createAndScheduleCampaign instead.'
    );
  }

  /**
   * Batch email sending not supported by MailWizz
   * Use campaigns instead
   */
  async sendBatch(emails: EmailOptions[]): Promise<void> {
    throw new Error(
      'MailWizz does not support direct batch sending. Use createAndScheduleCampaign instead.'
    );
  }

  /**
   * Create and schedule a campaign for a MailWizz list
   * Uses MailWizz Campaigns API
   */
  async createAndScheduleCampaign(options: CampaignOptions): Promise<CampaignResult> {
    try {
      // Prepare campaign data
      const campaignData = {
        campaign: {
          name: options.campaignName || `Campaign - ${options.subject}`,
          type: 'regular',
          from_name: options.fromName || this.defaultFromName,
          from_email: options.from || this.defaultFromEmail,
          subject: options.subject,
          reply_to: options.from || this.defaultFromEmail,
          list_uid: options.listId, // MailWizz uses list UID
          template: {
            content: options.htmlBody,
            ...(options.textBody && { plain_text: options.textBody }),
          },
        },
      };

      // Create campaign
      const createResponse = await this.client.post('/campaigns', campaignData);

      const campaignUid = createResponse.data.data.campaign_uid;

      if (!campaignUid) {
        throw new Error('Failed to get campaign UID from MailWizz response');
      }

      // Schedule or send immediately
      if (options.scheduleAt && options.scheduleAt > new Date()) {
        // MailWizz scheduling
        const scheduleData = {
          campaign: {
            send_at: options.scheduleAt.toISOString().replace('T', ' ').split('.')[0], // Format: YYYY-MM-DD HH:MM:SS
          },
        };

        await this.client.patch(`/campaigns/${campaignUid}`, scheduleData);

        return {
          campaignId: campaignUid,
          status: 'scheduled',
          message: `Campaign scheduled for ${options.scheduleAt.toISOString()}`,
        };
      } else {
        // Send immediately - unpause the campaign
        await this.client.put(`/campaigns/${campaignUid}/pause-unpause`, {
          campaign: {
            status: 'sending',
          },
        });

        return {
          campaignId: campaignUid,
          status: 'sent',
          message: 'Campaign sent immediately',
        };
      }
    } catch (error: any) {
      console.error('MailWizz campaign error:', error);

      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';

      throw new Error(`Failed to create/schedule MailWizz campaign: ${errorMessage}`);
    }
  }
}
