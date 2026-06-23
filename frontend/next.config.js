const basePath = process.env.NEXT_PUBLIC_BASE_PATH
    ?? (process.env.NODE_ENV === 'production' ? '/abqora-mvp' : '');

const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS || '172.25.43.248')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    basePath,
    assetPrefix: basePath,
    allowedDevOrigins,
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;
