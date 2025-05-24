// filepath: /home/e-kalite/Downloads/sakai-react/next.config.js
/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development' // Disable PWA in development
});

const nextConfig = {
    // images: {
    //     remotePatterns: [
    //     {protocol: 'https:', hostname:"lh3.googleusercontent.com", path: "/"},
    //     {protocol: 'https:', hostname:"res.cloudinary.com", path: "/"},

    //     ],
    // }



      output: 'standalone',
};

module.exports = withPWA(nextConfig);
