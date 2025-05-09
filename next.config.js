/** @type {import('next').NextConfig} */
const nextConfig = {
  /* 
  // Removing i18n config - not supported in App Router
  i18n: {
    defaultLocale: 'id',
    locales: ['id', 'en'],
    localeDetection: true,
  },
  */
  images: {
    domains: ['images.unsplash.com', 'plus.unsplash.com', 'via.placeholder.com'],
  },
  // Disable filesystem cache to avoid Windows permission errors
  experimental: {
    appDocumentPreloading: false,
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizeCss: true,
  },
  // Enable strict mode for better development
  reactStrictMode: true,
  // Add transpilePackages to ensure all dependencies are properly compiled
  transpilePackages: ["geist"],
  // Add webpack config to ignore Windows-specific Application Data folders
  webpack: (config, { isServer, dev }) => {
    // Exclude specific folders from webpack processing
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/Application Data/**',
        '**/AppData/**',
        '**/Local Settings/**',
        '**/node_modules/**',
      ],
    };
    
    return config;
  },
};

module.exports = nextConfig; 