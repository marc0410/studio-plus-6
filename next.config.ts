import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      {
        source: '/studio/index.html',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
