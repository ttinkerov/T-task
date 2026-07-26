import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';
const apiUrl = (
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001'
).replace(/\/$/, '');
const browserApiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(
  /\/$/,
  '',
);

const connectSrc = ["'self'", browserApiUrl];

// Next.js HMR / React Refresh evaluate and inject inline scripts in development.
// Keep production strict; use nonces later if production bootstrap scripts require it.
const scriptSrc = isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'", "'unsafe-eval'"];

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSrc.join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // blob:/data: — tldraw paste/export; assets are self-hosted under /tldraw
  `connect-src ${[...connectSrc, 'blob:', 'data:', 'ws:', 'wss:'].join(' ')}`,
  // tldraw uses blob: workers for some editor features
  "worker-src 'self' blob:",
  'frame-src https://docs.google.com https://drive.google.com https://www.figma.com https://miro.com https://airtable.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy,
  },
  ...(isProduction
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
    ],
  },
  // tldraw ships ESM that Next should transpile for App Router client chunks
  transpilePackages: ['tldraw', '@tldraw/assets'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
