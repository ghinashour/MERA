/** @type {import('next').NextConfig} */
module.exports = {
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_API: process.env.NEXT_PUBLIC_API || 'http://localhost:3000/api' },
};
