import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { getAllNewsletters, getNewsletter } from '@/lib/aws/dynamodb-client';
import { getPresignedUrl } from '@/lib/aws/s3-client';
import { Newsletter } from '@/lib/types/newsletter';

/**
 * Regenerate presigned URL if newsletter has S3 key
 * Presigned URLs expire, so we regenerate them on every fetch
 */
async function refreshPresignedUrl(newsletter: Newsletter): Promise<Newsletter> {
  if (newsletter.s3Key) {
    try {
      // Generate fresh presigned URL with 7 days expiry
      const freshUrl = await getPresignedUrl(newsletter.s3Key, 604800);
      return {
        ...newsletter,
        s3Url: freshUrl,
      };
    } catch (error) {
      console.error('Failed to regenerate presigned URL for newsletter:', newsletter.id, error);
      // Return newsletter as-is if URL regeneration fails
      return newsletter;
    }
  }
  return newsletter;
}

// GET /api/newsletter - Get all newsletters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const newsletter = await getNewsletter(id);
      if (!newsletter) {
        return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
      }

      // Regenerate presigned URL if expired
      const refreshedNewsletter = await refreshPresignedUrl(newsletter);
      return NextResponse.json({ newsletter: refreshedNewsletter });
    }

    const newsletters = await getAllNewsletters();

    // Regenerate presigned URLs for all newsletters
    const refreshedNewsletters = await Promise.all(
      newsletters.map(n => refreshPresignedUrl(n))
    );

    return NextResponse.json({ newsletters: refreshedNewsletters });
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletters' },
      { status: 500 }
    );
  }
}
