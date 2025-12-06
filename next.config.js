/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [
            'firebasestorage.googleapis.com',
            'lh3.googleusercontent.com',
            'via.placeholder.com',
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '100mb',
        },
    },
}

module.exports = nextConfig
