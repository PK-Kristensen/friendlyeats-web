/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		optimizeCss: true, // enabling this will enable SSR for Tailwind
	}
};

module.exports = nextConfig;
