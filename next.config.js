/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    domains: ['poolcompliancesa.com.au'],
  },
  // Configure dynamic routes
  async headers() {
    return [
      {
        source: '/checkout/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ];
  },
  // Disable static optimization for specific paths
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/checkout/:path*',
          destination: '/checkout/:path*',
          has: [
            {
              type: 'header',
              key: 'x-revalidate',
              value: 'false',
            },
          ],
        },
        {
          source: '/.well-known/apple-developer-merchantid-domain-association',
          destination: '/apple-developer-merchantid-domain-association',
        },
      ],
    };
  },
};

module.exports = nextConfig;
