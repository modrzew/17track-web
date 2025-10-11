# 17track-web

Web interface for tracking parcels using the 17Track API.

## Requirements

- Node.js 20+
- 17Track API token (get from https://api.17track.net/)

## Setup

Create `.env.local` with your API token:

```bash
SEVENTEENTRACK_TOKEN=your_api_token_here
```

Install dependencies:

```bash
npm install
```

## Development

```bash
npm run dev         # Start development server on http://localhost:3000
npm run type-check  # Check TypeScript types
npm run lint        # Run linter
npm run format      # Format code
```

## Production

```bash
npm run build  # Build for production
npm start      # Start production server
```

## Docker

```bash
# Using docker-compose
docker-compose up -d

# Manual build and run
docker build -t 17track-web .
docker run -p 3000:3000 -e SEVENTEENTRACK_TOKEN=your_token 17track-web
```

## Tech Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- IndexedDB for client-side caching

## How it works

The application proxies requests to the 17Track API through Next.js API routes to keep your API token server-side. Package data is cached in IndexedDB for 30 minutes to reduce API calls.
