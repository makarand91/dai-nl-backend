import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import {
  getNewsletterHistory,
  getAllHistory,
  getAllNewsletters,
} from '@/lib/aws/dynamodb-client';

// GET /api/newsletter/history?newsletterId=xxx - Get history for a specific newsletter or all
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const newsletterId = searchParams.get('newsletterId');

    if (newsletterId) {
      // Get history for specific newsletter
      const history = await getNewsletterHistory(newsletterId);
      return NextResponse.json({ history });
    } else {
      // Get all history
      const history = await getAllHistory();
      return NextResponse.json({ history });
    }
  } catch (error) {
    console.error('Error fetching newsletter history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletter history' },
      { status: 500 }
    );
  }
}
