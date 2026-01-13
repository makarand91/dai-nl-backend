import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import {
  getNewsletter,
  updateNewsletterStatus,
  addNewsletterHistory,
  saveNewsletter,
} from '@/lib/aws/dynamodb-client';
import { emailService } from '@/lib/email/email-service';
import { getBrandSettings } from '@/lib/settings/brand-settings';
import { randomUUID } from 'crypto';

// POST /api/newsletter/schedule - Schedule a newsletter campaign
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { newsletterId, scheduledFor } = body;

    if (!newsletterId || !scheduledFor) {
      return NextResponse.json(
        { error: 'Newsletter ID and scheduled time are required' },
        { status: 400 }
      );
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Get newsletter from DynamoDB
    const newsletter = await getNewsletter(newsletterId);
    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    // Get brand settings to retrieve listId
    if (!newsletter.brand) {
      return NextResponse.json(
        { error: 'Newsletter has no brand associated. Cannot schedule campaign.' },
        { status: 400 }
      );
    }

    const brandSettings = await getBrandSettings(newsletter.brand);
    if (!brandSettings.listId) {
      return NextResponse.json(
        { error: `No mailing list configured for brand: ${newsletter.brand}` },
        { status: 400 }
      );
    }

    // Create and schedule campaign with provider (Mailjet/MailWizz)
    const campaignResult = await emailService.createAndScheduleCampaign({
      listId: brandSettings.listId,
      subject: newsletter.subject,
      htmlBody: newsletter.htmlContent,
      textBody: newsletter.textContent,
      campaignName: newsletter.title,
      scheduleAt: scheduledDate,
    });

    // Update newsletter with campaign ID and status
    newsletter.campaignId = campaignResult.campaignId;
    newsletter.status = 'scheduled';
    newsletter.scheduledFor = scheduledDate.toISOString();
    newsletter.updatedAt = new Date().toISOString();

    await saveNewsletter(newsletter);

    // Add to history
    await addNewsletterHistory({
      id: randomUUID(),
      newsletterId,
      action: 'scheduled',
      timestamp: new Date().toISOString(),
      metadata: {
        scheduledFor: scheduledDate.toISOString(),
        campaignId: campaignResult.campaignId,
        brand: newsletter.brand,
        listId: brandSettings.listId,
      },
      userId: session.user?.email || undefined,
    });

    return NextResponse.json({
      success: true,
      message: campaignResult.message || 'Newsletter campaign scheduled successfully',
      scheduledFor: scheduledDate.toISOString(),
      campaignId: campaignResult.campaignId,
      status: campaignResult.status,
    });
  } catch (error) {
    console.error('Error scheduling newsletter campaign:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to schedule newsletter campaign'
      },
      { status: 500 }
    );
  }
}

// POST /api/newsletter/schedule/send - Manually trigger scheduled newsletter
// This would typically be called by a cron job or EventBridge rule
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { newsletterId, recipientList } = body;

    if (!newsletterId || !recipientList || !Array.isArray(recipientList)) {
      return NextResponse.json(
        { error: 'Newsletter ID and recipient list are required' },
        { status: 400 }
      );
    }

    // Get newsletter from DynamoDB
    const newsletter = await getNewsletter(newsletterId);
    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    if (newsletter.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Newsletter is not scheduled' },
        { status: 400 }
      );
    }

    // Send newsletter to all recipients
    await emailService.sendNewsletter(
      recipientList,
      newsletter.subject,
      newsletter.htmlContent,
      newsletter.textContent
    );

    // Update newsletter status to sent
    await updateNewsletterStatus(newsletterId, 'sent', {
      sentAt: new Date().toISOString(),
    });

    // Add to history
    await addNewsletterHistory({
      id: randomUUID(),
      newsletterId,
      action: 'sent',
      timestamp: new Date().toISOString(),
      metadata: {
        recipientCount: recipientList.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${recipientList.length} recipients`,
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);

    // Mark as failed
    const body = await request.json();
    if (body.newsletterId) {
      await updateNewsletterStatus(body.newsletterId, 'failed');
      await addNewsletterHistory({
        id: randomUUID(),
        newsletterId: body.newsletterId,
        action: 'failed',
        timestamp: new Date().toISOString(),
        metadata: {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}
