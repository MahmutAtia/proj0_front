/** @type {import('next').NextConfig} */
const nextConfig = {
    // images: {
    //     remotePatterns: [
    //     {protocol: 'https:', hostname:"lh3.googleusercontent.com", path: "/"},
    //     {protocol: 'https:', hostname:"res.cloudinary.com", path: "/"},

    //     ],
    // }

    experimental: {
        // …
        serverComponentsExternalPackages: ['@react-pdf/renderer'],
      },

      output: 'standalone',
}

module.exports = nextConfig
