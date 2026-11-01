import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Lets phones on the local network load dev assets and hydrate the app.
  allowedDevOrigins: ['192.168.1.247'],
};

export default nextConfig;
