// Dynamic route for /{trackingNumber}
// This allows accessing package details directly via URL
import Home from '../page';

// Tell Next.js not to statically generate any paths
export function generateStaticParams() {
  return [];
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default Home;
