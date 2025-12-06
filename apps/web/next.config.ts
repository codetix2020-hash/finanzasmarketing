import { withContentCollections } from "@content-collections/next";
// @ts-expect-error - PrismaPlugin is not typed
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
import * as Sentry from "@sentry/nextjs";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import nextIntlPlugin from "next-intl/plugin";

const withNextIntl = nextIntlPlugin("./modules/i18n/request.ts");

const nextConfig: NextConfig = {
				typescript: {
								ignoreBuildErrors: true,
				},
				eslint: {
								ignoreDuringBuilds: true,
				},
				transpilePackages: ["@repo/api", "@repo/auth", "@repo/database"],
				images: {
								remotePatterns: [
												{
																// google profile images
																protocol: "https",
																hostname: "lh3.googleusercontent.com",
												},
												{
																// github profile images
																protocol: "https",
																hostname: "avatars.githubusercontent.com",
												},
								],
				},
				async redirects() {
								return [
												{
																source: "/app/settings",
																destination: "/app/settings/general",
																permanent: true,
												},
												{
																source: "/app/:organizationSlug/settings",
																destination: "/app/:organizationSlug/settings/general",
																permanent: true,
												},
												{
																source: "/app/admin",
																destination: "/app/admin/users",
																permanent: true,
												},
								];
				},
				webpack: (config, { webpack, isServer }) => {
								config.plugins.push(
												new webpack.IgnorePlugin({
																resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
												}),
								);

								if (isServer) {
												config.plugins.push(new PrismaPlugin());
								}

								return config;
				},
};

export default withSentryConfig(Sentry.withSentryConfig(withContentCollections(withNextIntl(nextConfig)), {
				// For all available options, see:
				// https://github.com/getsentry/sentry-webpack-plugin#options

				// Suppresses source map uploading logs during build
				silent: true,
				org: "codetix",
				project: "javascript-nextjs",
}, {
				// For all available options, see:
				// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

				// Upload a larger set of source maps for prettier stack traces (increases build time)
				widenClientFileUpload: true,

				// Transpiles SDK to be compatible with IE11 (increases bundle size)
				transpileClientSDK: true,

				// Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
				// This can increase your server load as well as your hosting bill.
				// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
				// side errors will fail.
				tunnelRoute: "/monitoring",

				// Hides source maps from generated client bundles
				hideSourceMaps: true,

				// Automatically tree-shake Sentry logger statements to reduce bundle size
				disableLogger: true,

				// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
				// See the following for more information:
				// https://docs.sentry.io/product/crons/
				// https://vercel.com/docs/cron-jobs
				automaticVercelMonitors: true,
}), {
 // For all available options, see:
	// https://www.npmjs.com/package/@sentry/webpack-plugin#options

	org: "codetix",

 project: "javascript-nextjs",

 // Only print logs for uploading source maps in CI
	silent: !process.env.CI,

 // For all available options, see:
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

	// Upload a larger set of source maps for prettier stack traces (increases build time)
	widenClientFileUpload: true,

 // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
	// This can increase your server load as well as your hosting bill.
	// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
	// side errors will fail.
	tunnelRoute: "/monitoring",

 // Automatically tree-shake Sentry logger statements to reduce bundle size
	disableLogger: true,

 // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
	// See the following for more information:
	// https://docs.sentry.io/product/crons/
	// https://vercel.com/docs/cron-jobs
	automaticVercelMonitors: true,
});