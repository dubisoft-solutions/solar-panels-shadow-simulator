import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const isGithubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: isProd && isGithubPages ? '/shadow-simulator' : '',
  assetPrefix: isProd && isGithubPages ? '/shadow-simulator/' : '',
};

export default nextConfig;
