/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'fluent-ffmpeg']
  },
  webpack: (config) => {
    config.externals.push({
      'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
    });
    return config;
  },
};

export default nextConfig;