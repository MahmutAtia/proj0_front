// @ts-check

const {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} = require("next/constants");

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  trailingSlash: false,

  // Image optimization
  images: {
    domains: [
      'localhost',
      process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/^https?:\/\//, '') || '',
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      // Prevent caching of auth-related routes
      {
        source: '/api/auth/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/login',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/logout',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ];
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Ignore specific warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@ducanh2912\/next-pwa/ },
    ];

    return config;
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = (phase) => {
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    const withPWA = require("@ducanh2912/next-pwa").default({
      dest: "public",
      disable: process.env.NODE_ENV === "development",
      register: true,

      // Workbox options to prevent auth token caching
      workboxOptions: {
        disableDevLogs: true,
        skipWaiting: true, // Move skipWaiting here

        // Runtime caching rules
        runtimeCaching: [
          // Don't cache auth-related requests
          {
            urlPattern: ({ request, url }) => {
              // Don't cache requests with Authorization header
              if (request.headers.get('Authorization')) {
                return false;
              }

              // Don't cache auth endpoints
              const authPaths = ['/api/auth', '/api/token', '/login', '/logout'];
              if (authPaths.some(path => url.pathname.includes(path))) {
                return false;
              }

              // Don't cache backend API requests
              if (url.origin === process.env.NEXT_PUBLIC_BACKEND_URL) {
                return false;
              }

              return false; // This rule is just for exclusion
            },
            handler: 'NetworkOnly',
          },

          // Cache static assets
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },

          // Cache JS/CSS files
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
            },
          },

          // Network first for same-origin requests (excluding auth)
          {
            urlPattern: ({ url, request }) => {
              // Only for same origin
              if (url.origin !== self.location.origin) return false;

              // Exclude auth-related requests
              if (request.headers.get('Authorization') ||
                  request.headers.get('Cookie')) {
                return false;
              }

              // Exclude auth paths
              const authPaths = ['/login', '/logout', '/auth', '/api/auth'];
              if (authPaths.some(path => url.pathname.includes(path))) {
                return false;
              }

              return true;
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
            },
          },
        ],

        // Don't precache auth-related files
        manifestTransforms: [
          (manifestEntries) => {
            const manifest = manifestEntries.filter(entry => {
              const authPaths = ['login', 'logout', 'auth', 'api/auth'];
              return !authPaths.some(path => entry.url.includes(path));
            });
            return { manifest };
          },
        ],

        // Navigation fallback
        navigateFallback: '/offline',
        navigateFallbackDenylist: [
          /^\/_/,
          /\/[^/?]+\.[^/]+$/,
          /\/api\//,
          /\/auth\//,
          /\/login/,
          /\/logout/,
        ],
      },
    });

    return withPWA(nextConfig);
  }

  return nextConfig;
};
