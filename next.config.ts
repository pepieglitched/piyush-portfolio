import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { loader: 'custom', loaderFile: './src/lib/image-loader.ts' },
  poweredByHeader: false,
  // Export builds need no persistent webpack pack; development retains its normal cache.
  webpack(config, {dev}) { if (!dev) config.cache = false; return config; },
};
export default config;
