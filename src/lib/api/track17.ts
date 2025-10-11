import { PackageStatus } from '../types';
import type {
  ApiResponse,
  RegisterTrackingRequest,
  RegisterTrackingResponse,
  GetTrackListRequest,
  GetTrackListResponse,
  GetTrackInfoResponse,
  TrackListItem,
  TrackingEvent,
  Package,
  PackageDetails,
} from '../types';

// Rate limiter: max 3 requests per second
class RateLimiter {
  private queue: Array<() => void> = [];
  private processing = false;
  private readonly interval = 350; // ~3 req/sec (allowing some buffer)

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const task = this.queue.shift();

    if (task) {
      await task();
      setTimeout(() => {
        this.processing = false;
        this.process();
      }, this.interval);
    } else {
      this.processing = false;
    }
  }
}

const rateLimiter = new RateLimiter();

class Track17ApiError extends Error {
  constructor(
    public code: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'Track17ApiError';
  }
}

class Track17Api {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return rateLimiter.execute(async () => {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Track17ApiError(
          response.status,
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result: ApiResponse<T> = await response.json();

      if (result.code !== 0) {
        throw new Track17ApiError(
          result.code,
          result.msg || 'API request failed',
          result.data
        );
      }

      return result;
    });
  }

  async registerTracking(
    request: RegisterTrackingRequest
  ): Promise<RegisterTrackingResponse> {
    const response = await this.request<RegisterTrackingResponse>(
      '/api/packages',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
    return response.data;
  }

  async getTrackList(
    request: GetTrackListRequest = {}
  ): Promise<GetTrackListResponse> {
    const params = new URLSearchParams();
    if (request.page) params.set('page', request.page.toString());
    if (request.page_size) params.set('page_size', request.page_size.toString());

    const response = await this.request<GetTrackListResponse>(
      `/api/packages?${params.toString()}`,
      { method: 'GET' }
    );
    return response.data;
  }

  async getTrackInfo(trackingNumbers: string[]): Promise<GetTrackInfoResponse> {
    if (trackingNumbers.length === 0) {
      return { accepted: [], rejected: [] };
    }

    if (trackingNumbers.length > 1) {
      // For multiple tracking numbers, we need to make multiple requests
      // For now, just support single tracking number
      throw new Error('Multiple tracking numbers not yet supported');
    }

    const response = await this.request<GetTrackInfoResponse>(
      `/api/packages/${encodeURIComponent(trackingNumbers[0])}`,
      { method: 'GET' }
    );
    return response.data;
  }

  async deleteTracking(trackingNumbers: string[]): Promise<void> {
    if (trackingNumbers.length === 0) return;

    // Delete one at a time
    for (const trackingNumber of trackingNumbers) {
      await this.request(
        `/api/packages/${encodeURIComponent(trackingNumber)}`,
        { method: 'DELETE' }
      );
    }
  }

  // Helper to convert package_status string to enum
  static parsePackageStatus(status: string): PackageStatus {
    const statusMap: Record<string, PackageStatus> = {
      'NotFound': PackageStatus.NotFound,
      'InTransit': PackageStatus.InTransit,
      'PickUp': PackageStatus.PickUp,
      'Undelivered': PackageStatus.Undelivered,
      'Delivered': PackageStatus.Delivered,
      'Alert': PackageStatus.Alert,
      'Expired': PackageStatus.Expired,
    };
    return statusMap[status] || PackageStatus.NotFound;
  }

  // Helper method to convert TrackListItem (from /gettracklist) to Package
  static convertTrackListItemToPackage(item: TrackListItem): Package {
    return {
      trackingNumber: item.number,
      carrierCode: item.carrier,
      status: this.parsePackageStatus(item.package_status),
      title: item.tag || undefined,
      createdAt: item.register_time || new Date().toISOString(),
      updatedAt: item.track_time || new Date().toISOString(),
      lastEvent: item.latest_event_info ? {
        a: item.latest_event_info,
        c: '',
        d: item.latest_event_time ? new Date(item.latest_event_time).getTime().toString() : '',
        z: 0,
      } : undefined,
    };
  }

  // Helper method to convert API response to PackageDetails (from /gettrackinfo)
  static convertToPackageDetails(
    trackInfo: GetTrackInfoResponse['accepted'][0]
  ): PackageDetails {
    // Extract tracking events from the nested structure
    const events: TrackingEvent[] = [];

    if (trackInfo.track_info?.tracking?.providers) {
      for (const provider of trackInfo.track_info.tracking.providers) {
        if (provider.events) {
          for (const event of provider.events) {
            // Use time_utc or time_iso, convert to Unix timestamp (seconds)
            const timeStr = event.time_utc || event.time_iso;
            const timestamp = timeStr ? Math.floor(new Date(timeStr).getTime() / 1000).toString() : '';

            events.push({
              a: event.description || '',
              c: event.location || '',
              d: timestamp,
              z: 0,
            });
          }
        }
      }
    }

    // If no nested events, create one from latest_event_info
    if (events.length === 0 && trackInfo.latest_event_info) {
      const timestamp = trackInfo.latest_event_time
        ? Math.floor(new Date(trackInfo.latest_event_time).getTime() / 1000).toString()
        : '';

      events.push({
        a: trackInfo.latest_event_info,
        c: '',
        d: timestamp,
        z: 0,
      });
    }

    return {
      trackingNumber: trackInfo.number,
      carrierCode: trackInfo.carrier,
      status: this.parsePackageStatus(trackInfo.package_status || 'NotFound'),
      title: trackInfo.tag || undefined,
      createdAt: trackInfo.register_time || new Date().toISOString(),
      updatedAt: trackInfo.track_time || new Date().toISOString(),
      lastEvent: events[0],
      trackingHistory: events,
    };
  }
}

// Export singleton instance and class
export const track17Api = new Track17Api();
export { Track17Api, Track17ApiError };
