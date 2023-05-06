/** @type {import('next').NextConfig} */
const nextConfig = {
   reactStrictMode: true,
   experimental: {
      appDir: true,
      swcPlugins: [
         [require.resolve('@lazy-init/nextjs-plugin'), {}],
      ],
   },
}

module.exports = nextConfig
