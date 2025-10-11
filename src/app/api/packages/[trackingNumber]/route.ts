import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.17track.net';
const API_VERSION = 'v2.4';
const API_TOKEN = process.env['17TRACK_TOKEN'];

// GET /api/packages/[trackingNumber] - Get tracking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;

    const response = await fetch(`${API_BASE_URL}/track/${API_VERSION}/gettrackinfo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        '17token': API_TOKEN || '',
      },
      body: JSON.stringify([{ number: trackingNumber }]),
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
    console.error('Error fetching package details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package details' },
      { status: 500 }
    );
  }
}

// DELETE /api/packages/[trackingNumber] - Delete package
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;

    const response = await fetch(`${API_BASE_URL}/track/${API_VERSION}/deletetrack`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        '17token': API_TOKEN || '',
      },
      body: JSON.stringify([{ number: trackingNumber }]),
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
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { error: 'Failed to delete package' },
      { status: 500 }
    );
  }
}
