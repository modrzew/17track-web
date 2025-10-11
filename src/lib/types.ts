// Carrier types
export interface Carrier {
  key: number;
  _country: number;
  _country_iso: string;
  _email: string | null;
  _tel: string | null;
  _url: string;
  _name: string;
  _name_zh_cn?: string;
  _name_zh_hk?: string;
}

// Package status enum
export enum PackageStatus {
  NotFound = 0,
  InTransit = 10,
  PickUp = 20,
  Undelivered = 30,
  Delivered = 40,
  Alert = 50,
  Expired = 60,
}

// Tracking event
export interface TrackingEvent {
  a: string; // Event description
  c: string; // Location
  d: string; // Date (timestamp)
  z: number; // Status code
}

// Track info from API (/gettrackinfo response has different structure than /gettracklist)
export interface TrackInfoDetailed {
  number: string;
  carrier: number;
  package_status?: string;
  track_info?: {
    tracking?: {
      providers?: Array<{
        events?: Array<{
          time_iso?: string;
          time_utc?: string;
          description?: string;
          location?: string;
        }>;
      }>;
    };
  };
  latest_event_time?: string;
  latest_event_info?: string;
  register_time?: string;
  track_time?: string;
  tag?: string | null;
}

// Legacy format (keeping for backwards compatibility)
export interface TrackInfo {
  no: string; // Tracking number
  track: {
    b: number; // Carrier ID
    c: number; // Status
    e: number; // SubStatus
    w1: TrackingEvent[]; // Tracking history
  };
  z0?: {
    a: string; // Destination
    b: string; // Origin
  };
}

// Package data structure for local storage
export interface Package {
  trackingNumber: string;
  carrierCode: number;
  status: PackageStatus;
  title?: string; // User-defined title
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  lastEvent?: TrackingEvent;
  destination?: string;
  origin?: string;
}

// Detailed package info with full tracking history
export interface PackageDetails extends Package {
  trackingHistory: TrackingEvent[];
}

// API Request types
export interface RegisterTrackingRequest {
  number: string;
  carrier: number;
  tag?: string; // User-defined title
  auto_detection?: 0 | 1; // Auto-detect carrier
}

export interface GetTrackListRequest {
  page?: number;
  page_size?: number; // Max 40
  state?: PackageStatus[];
  created_at_min?: string; // Unix timestamp
  created_at_max?: string; // Unix timestamp
}

export interface GetTrackInfoRequest {
  numbers: string[]; // Max 40
}

export interface DeleteTrackingRequest {
  numbers: string[];
}

export interface ChangeCarrierRequest {
  number: string;
  carrier: number;
}

export interface ChangeInfoRequest {
  number: string;
  carrier: number;
  items: {
    tag?: string;
  };
}

export interface ChangeInfoResponse {
  accepted: Array<{
    number: string;
    carrier: number;
  }>;
  rejected: Array<{
    number: string;
    error: {
      code: number;
      message: string;
    };
  }>;
}

// API Response types
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  msg?: string;
}

export interface RegisterTrackingResponse {
  accepted: Array<{
    number: string;
    carrier: number;
  }>;
  rejected: Array<{
    number: string;
    error: {
      code: number;
      message: string;
    };
  }>;
}

// Track list item from /gettracklist (different format than /gettrackinfo)
export interface TrackListItem {
  number: string;
  carrier: number;
  package_status: string; // "Delivered", "InTransit", etc.
  latest_event_time: string;
  latest_event_info: string;
  register_time: string;
  track_time: string;
  tag?: string | null;
}

export interface GetTrackListResponse {
  accepted: TrackListItem[];
}

export interface GetTrackInfoResponse {
  accepted: TrackInfoDetailed[];
  rejected: Array<{
    number: string;
    error: {
      code: number;
      message: string;
    };
  }>;
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface PackageCache {
  packages: CacheEntry<Package[]>;
  packageDetails: Map<string, CacheEntry<PackageDetails>>;
}
