/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: __dirname.replace(/\\/g, "/"),
};

module.exports = nextConfig;