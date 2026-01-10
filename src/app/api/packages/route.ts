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
    const {
      number,
      carrier,
      tag,
      // Custom fields for carriers that require additional info
      destination_postal_code,
      origin_postal_code,
      ship_date,
      destination_country,
      origin_country,
    } = body;

    if (!number || !carrier) {
      return NextResponse.json(
        { error: 'Missing required fields: number, carrier' },
        { status: 400 }
      );
    }

    // Build tracking object with optional custom fields
    const trackingData: Record<string, unknown> = {
      number,
      carrier,
    };

    // Add optional fields only if they have values
    if (tag) trackingData.tag = tag;
    if (destination_postal_code) trackingData.destination_postal_code = destination_postal_code;
    if (origin_postal_code) trackingData.origin_postal_code = origin_postal_code;
    if (ship_date) trackingData.ship_date = ship_date;
    if (destination_country) trackingData.destination_country = destination_country;
    if (origin_country) trackingData.origin_country = origin_country;

    const response = await fetch(`${API_BASE_URL}/track/${API_VERSION}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        '17token': API_TOKEN || '',
      },
      body: JSON.stringify([trackingData]),
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
