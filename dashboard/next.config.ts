import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Pin the file-tracing root to this app so Next stops guessing when other
  // lockfiles exist higher up the tree (for example a stray ~/package-lock.json).
  outputFileTracingRoot: path.join(__dirname),
};
export default nextConfig;
