/** @type {import('next').NextConfig} */
const nextConfig = {
   reactStrictMode: true,
   experimental: {
      swcPlugins: [
         [require.resolve('@lazy-init/plugin-swc-v83'), {}],
      ],
   },
}

module.exports = nextConfig
