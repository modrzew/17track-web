import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.17track.net';
const API_VERSION = 'v2.4';
const API_TOKEN = process.env.SEVENTEENTRACK_TOKEN;

// GET /api/packages - List packages
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('page_size') || '40';

    // Default: get packages from last 7 days
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const response = await fetch(`${API_BASE_URL}/track/${API_VERSION}/gettracklist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        '17token': API_TOKEN || '',
      },
      body: JSON.stringify({
        page: parseInt(page),
        page_size: parseInt(pageSize),
        created_at_min: Math.floor(sevenDaysAgo / 1000).toString(),
        created_at_max: Math.floor(now / 1000).toString(),
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}

// POST /api/packages - Register new package
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { number, carrier, tag } = body;

    if (!number || !carrier) {
      return NextResponse.json(
        { error: 'Missing required fields: number, carrier' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/track/${API_VERSION}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        '17token': API_TOKEN || '',
      },
      body: JSON.stringify([
        {
          number,
          carrier,
          tag,
        },
      ]),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error registering package:', error);
    return NextResponse.json({ error: 'Failed to register package' }, { status: 500 });
  }
}
