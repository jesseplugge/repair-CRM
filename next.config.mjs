/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // signature images / logo uploads
    },
  },
};

export default nextConfig;
