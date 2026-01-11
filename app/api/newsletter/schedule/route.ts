import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import {
  getNewsletter,
  updateNewsletterStatus,
  addNewsletterHistory,
} from '@/lib/aws/dynamodb-client';
import { randomUUID } from 'crypto';

// POST /api/newsletter/schedule - Schedule a newsletter for sending
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { newsletterId, scheduledFor, recipientList } = body;

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

    // Update newsletter status to scheduled
    await updateNewsletterStatus(newsletterId, 'scheduled', {
      scheduledFor: scheduledDate.toISOString(),
    });

    // Add to history
    await addNewsletterHistory({
      id: randomUUID(),
      newsletterId,
      action: 'scheduled',
      timestamp: new Date().toISOString(),
      metadata: {
        scheduledFor: scheduledDate.toISOString(),
        recipientCount: recipientList?.length || 0,
      },
      userId: session.user?.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Newsletter scheduled successfully',
      scheduledFor: scheduledDate.toISOString(),
    });
  } catch (error) {
    console.error('Error scheduling newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to schedule newsletter' },
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

    // In production, you would send emails here
    // For now, we'll just update the status
    // import { sendNewsletter } from '@/lib/aws/ses-client';
    // await sendNewsletter(recipientList, newsletter.subject, newsletter.htmlContent, newsletter.textContent);

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
