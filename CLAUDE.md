# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 web application for tracking parcels using the 17Track API. It features a client-side React application with server-side API proxying, IndexedDB caching, and a responsive UI with Tailwind CSS.

## Development Commands

```bash
# Development server (uses Turbopack)
# Note: Automatically downloads carriers.json before starting
npm run dev

# Production build
# Note: Automatically downloads carriers.json before building
npm run build

# Start production server
npm start

# Lint the codebase
npm run lint

# Type check
npm run type-check

# Format code
npm run format

# Check code formatting
npm run format:check
```

## Docker

```bash
# Build and run with docker-compose
docker-compose up -d

# Build Docker image manually
docker build -t 17track-web .

# Run with environment variables
docker run -p 3000:3000 -e SEVENTEENTRACK_TOKEN=your_token 17track-web
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15.5.4 with App Router
- **Runtime**: React 19.1.0
- **Styling**: Tailwind CSS 4
- **Build Tool**: Turbopack
- **TypeScript**: Strict mode enabled

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Main home page (client component)
│   ├── [trackingNumber]/  # Dynamic route for direct package links
│   └── api/               # API routes (server-side proxy to 17Track)
├── components/            # React components
├── hooks/                 # Custom React hooks
│   ├── usePackages.ts    # Package list management
│   ├── usePackageDetails.ts  # Individual package details
│   └── useCarriers.ts    # Carrier data access
├── lib/
│   ├── api/
│   │   └── track17.ts    # 17Track API client (rate-limited)
│   ├── cache/
│   │   ├── storage.ts    # IndexedDB operations
│   │   └── ttl.ts        # Cache freshness logic (30 min TTL)
│   └── types.ts          # TypeScript type definitions
```

### Data Flow

1. **Package List**: `usePackages` hook → loads from IndexedDB cache → checks freshness (30 min) → fetches from `/api/packages` if stale
2. **Package Details**: `usePackageDetails` hook → similar cache-first strategy → fetches from `/api/packages/[trackingNumber]`
3. **API Proxying**: All 17Track API calls go through Next.js API routes to keep the API token server-side
4. **Rate Limiting**: Client-side rate limiter enforces ~3 requests/second to 17Track API

### Key Architecture Patterns

- **Cache-first strategy**: Always load from IndexedDB immediately, then refresh from API only if cache is stale (> 30 minutes)
- **Optimistic UI**: Display cached data instantly while fetching updates in the background
- **API token security**: 17Track API token stored in `.env.local` and only accessed server-side
- **Client-side state**: URL reflects selected package (e.g., `/AB123456789US`) with browser history support
- **Single-page navigation**: Uses `window.history.pushState()` to update URL without page reload

### State Management

- No external state library; uses React hooks (`useState`, `useEffect`, `useCallback`)
- Package data persisted in IndexedDB via `packageStorage` singleton
- State flows from hooks to components via props

### API Integration

**17Track API Routes** (server-side):
- `GET /api/packages` → proxies to `POST /track/v2.4/gettracklist`
- `POST /api/packages` → proxies to `POST /track/v2.4/register`
- `GET /api/packages/[trackingNumber]` → proxies to `POST /track/v2.4/gettrackinfo`
- `DELETE /api/packages/[trackingNumber]` → proxies to `POST /track/v2.4/deletetrack`

All API routes handle authentication via `SEVENTEENTRACK_TOKEN` environment variable.

### Type System

Key types are centralized in `src/lib/types.ts`:
- `Package`: Basic package info for list view
- `PackageDetails`: Extended with full tracking history
- `TrackingEvent`: Individual status update event
- `PackageStatus`: Enum for delivery states

## Environment Variables

Required in `.env.local` (see `.env.example` for template):
```bash
# Required: 17Track API token (get from https://api.17track.net/)
SEVENTEENTRACK_TOKEN=your_api_token_here

# Optional: Carriers data URL (defaults to 17Track's CDN)
CARRIERS_URL=https://res.17track.net/asset/carrier/info/apicarrier.all.json
```

For Docker deployments, set `SEVENTEENTRACK_TOKEN` as an environment variable. The `CARRIERS_URL` is only used at build time.

## Path Aliases

TypeScript path alias: `@/*` maps to `./src/*`

Example: `import { usePackages } from '@/hooks/usePackages';`

## Important Implementation Notes

- **Turbopack**: All build commands use `--turbopack` flag
- **Strict TypeScript**: `strict: true` in tsconfig.json - all code must be properly typed
- **IndexedDB**: Only available client-side; check `typeof window !== 'undefined'`
- **Carrier data**: Managed via `src/lib/carriers.json`
  - Stub file (empty array) committed to repo for type checking
  - Auto-populated with 1000+ carriers via `scripts/download-carriers.js` during dev/build (predev/prebuild hooks)
  - Downloads from 17Track's CDN (configurable via `CARRIERS_URL` env var)
  - App gracefully handles empty carriers array (e.g., during CI or before first download)
- **React 19**: Uses latest React features; ensure compatibility when adding dependencies
- **Standalone build**: `output: 'standalone'` in next.config.ts for optimal Docker images

## Styling Conventions

- Uses Tailwind CSS utility classes
- Responsive design with mobile-first approach
- Dark mode not currently implemented
- SVG icons extracted to named components (per user preferences in ~/.claude/CLAUDE.md)

