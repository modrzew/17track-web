import { NextResponse } from 'next/server';
import type { Carrier } from '@/lib/types';
import carriersData from '@/lib/carriers.json';

const API_BASE_URL = 'https://api.17track.net';
const API_VERSION = 'v2.4';
const API_TOKEN = process.env.SEVENTEENTRACK_TOKEN;

const PAGE_SIZE = 40;

interface TrackListItem {
  number: string;
  carrier: number;
  package_status: string;
  latest_event_time: string;
  latest_event_info: string;
  tag?: string | null;
}

interface TrackListResponse {
  code: number;
  data: {
    accepted: TrackListItem[];
  };
}

function buildCarrierMap(): Map<number, string> {
  const map = new Map<number, string>();
  for (const carrier of carriersData as Carrier[]) {
    map.set(carrier.key, carrier._name);
  }
  return map;
}

export async function GET() {
  try {
    const carrierMap = buildCarrierMap();

    const now = Date.now();
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

    const allItems: TrackListItem[] = [];
    let page = 1;

    while (true) {
      const response = await fetch(`${API_BASE_URL}/track/${API_VERSION}/gettracklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '17token': API_TOKEN || '',
        },
        body: JSON.stringify({
          page,
          page_size: PAGE_SIZE,
          created_at_min: Math.floor(ninetyDaysAgo / 1000).toString(),
          created_at_max: Math.floor(now / 1000).toString(),
        }),
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `HTTP ${response.status}: ${response.statusText}` },
          { status: response.status }
        );
      }

      const data: TrackListResponse = await response.json();
      const items = data.data?.accepted ?? [];
      allItems.push(...items);

      if (items.length < PAGE_SIZE) {
        break;
      }

      page++;
    }

    const activePackages = allItems
      .filter(item => item.package_status !== 'Delivered')
      .map(item => ({
        tracking_number: item.number,
        courier: carrierMap.get(item.carrier) ?? String(item.carrier),
        name: item.tag ?? null,
        status: item.package_status,
        last_update: {
          timestamp: item.latest_event_time || null,
          description: item.latest_event_info || null,
        },
      }));

    return NextResponse.json(activePackages);
  } catch (error) {
    console.error('Error fetching active packages:', error);
    return NextResponse.json({ error: 'Failed to fetch active packages' }, { status: 500 });
  }
}
