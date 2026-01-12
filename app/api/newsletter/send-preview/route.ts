import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { emailService } from '@/lib/email/email-service';
import { getNewsletter, addNewsletterHistory } from '@/lib/aws/dynamodb-client';
import { randomUUID } from 'crypto';

// POST /api/newsletter/send-preview - Send a preview email
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { newsletterId, recipientEmail } = body;

    if (!newsletterId || !recipientEmail) {
      return NextResponse.json(
        { error: 'Newsletter ID and recipient email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Get newsletter from DynamoDB
    const newsletter = await getNewsletter(newsletterId);
    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    // Send preview email
    await emailService.sendNewsletterPreview(
      recipientEmail,
      newsletter.subject,
      newsletter.htmlContent
    );

    // Add to history
    await addNewsletterHistory({
      id: randomUUID(),
      newsletterId,
      action: 'preview_sent',
      timestamp: new Date().toISOString(),
      metadata: {
        recipientEmail,
      },
      userId: session.user?.email || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Preview email sent to ${recipientEmail}`,
    });
  } catch (error) {
    console.error('Error sending preview email:', error);
    return NextResponse.json(
      { error: 'Failed to send preview email' },
      { status: 500 }
    );
  }
}
