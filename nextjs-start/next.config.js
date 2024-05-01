/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		optimizeCss: true, 
		appDir: true, 
	},
	pagesPath: 'app',
};

module.exports = nextConfig;
