import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { getAllNewsletters, getNewsletter } from '@/lib/aws/dynamodb-client';

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
      return NextResponse.json({ newsletter });
    }

    const newsletters = await getAllNewsletters();
    return NextResponse.json({ newsletters });
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletters' },
      { status: 500 }
    );
  }
}
