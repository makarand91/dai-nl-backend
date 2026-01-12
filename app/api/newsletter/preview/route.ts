import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { uploadNewsletterToS3 } from '@/lib/aws/s3-client';
import {
  saveNewsletter,
  getNewsletter,
  addNewsletterHistory,
  saveNewsletterPreview,
} from '@/lib/aws/dynamodb-client';
import { getStrapiNewsletter, convertStrapiContentToHTML } from '@/lib/utils/strapi-client';
import { Newsletter, NewsletterPreview } from '@/lib/types/newsletter';
import { randomUUID } from 'crypto';

// POST /api/newsletter/preview - Create a preview from Strapi content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { strapiContentId, title, subject, htmlContent } = body;

    let finalHtmlContent = htmlContent;
    let finalTitle = title;
    let finalSubject = subject;

    // If Strapi content ID is provided, fetch from Strapi
    if (strapiContentId) {
      const strapiContent = await getStrapiNewsletter(strapiContentId);
      if (!strapiContent) {
        return NextResponse.json(
          { error: 'Newsletter not found in Strapi' },
          { status: 404 }
        );
      }

      finalTitle = strapiContent.attributes.title;
      finalSubject = strapiContent.attributes.subject;
      finalHtmlContent =
        strapiContent.attributes.htmlContent ||
        (await convertStrapiContentToHTML(strapiContent.attributes.content));
    }

    if (!finalHtmlContent || !finalTitle || !finalSubject) {
      return NextResponse.json(
        { error: 'Missing required fields: title, subject, and htmlContent' },
        { status: 400 }
      );
    }

    const newsletterId = randomUUID();
    const previewId = randomUUID();

    // Upload to S3
    const { key, url } = await uploadNewsletterToS3(newsletterId, finalHtmlContent);

    // Save newsletter to DynamoDB
    const newsletter: Newsletter = {
      id: newsletterId,
      title: finalTitle,
      subject: finalSubject,
      htmlContent: finalHtmlContent,
      strapiContentId: strapiContentId?.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      s3Key: key,
      s3Url: url,
    };

    await saveNewsletter(newsletter);

    // Save preview
    const preview: NewsletterPreview = {
      id: previewId,
      newsletterId,
      htmlContent: finalHtmlContent,
      s3Key: key,
      s3Url: url,
      createdAt: new Date().toISOString(),
    };

    await saveNewsletterPreview(preview);

    // Add to history
    await addNewsletterHistory({
      id: randomUUID(),
      newsletterId,
      action: 'previewed',
      timestamp: new Date().toISOString(),
      userId: session.user?.email || undefined,
    });

    return NextResponse.json({
      success: true,
      newsletter,
      preview,
      previewUrl: url,
    });
  } catch (error) {
    console.error('Error creating newsletter preview:', error);
    return NextResponse.json(
      { error: 'Failed to create newsletter preview' },
      { status: 500 }
    );
  }
}

// GET /api/newsletter/preview?id=xxx - Get a specific preview
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Newsletter ID is required' }, { status: 400 });
    }

    const newsletter = await getNewsletter(id);
    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    return NextResponse.json({ newsletter });
  } catch (error) {
    console.error('Error fetching newsletter preview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletter preview' },
      { status: 500 }
    );
  }
}
