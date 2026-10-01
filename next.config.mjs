import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const emptyPolyfill = path.join(__dirname, 'lib/empty-polyfill.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      // Local / self-hosted uploads served by the Nest API
      (() => {
        try {
          const u = new URL(
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
          );
          return {
            protocol: u.protocol.replace(':', ''),
            hostname: u.hostname,
            ...(u.port ? { port: u.port } : {}),
            pathname: '/uploads/**',
          };
        } catch {
          return {
            protocol: 'http',
            hostname: 'localhost',
            port: '3001',
            pathname: '/uploads/**',
          };
        }
      })(),
    ],
  },
  experimental: {
    optimizePackageImports: [
      'antd',
      '@ant-design/icons',
      'framer-motion',
      'lucide-react',
      'recharts',
      'dayjs',
    ],
  },
  // Monorepo has a root lockfile; pin Turbopack to this app.
  turbopack: {
    root: __dirname,
    resolveAlias: {
      'next/dist/build/polyfills/polyfill-module': './lib/empty-polyfill.js',
      '../build/polyfills/polyfill-module': './lib/empty-polyfill.js',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'next/dist/build/polyfills/polyfill-module': emptyPolyfill,
      '../build/polyfills/polyfill-module': emptyPolyfill,
    };
    return config;
  },
};

export default nextConfig;
