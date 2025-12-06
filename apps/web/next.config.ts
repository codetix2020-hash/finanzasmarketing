import { withContentCollections } from "@content-collections/next";
// @ts-expect-error - PrismaPlugin is not typed
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
// Temporarily disabled Sentry to fix build conflicts
// import * as Sentry from "@sentry/nextjs";
// import { withSentryConfig } from "@sentry/nextjs";
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

// Temporarily disabled Sentry wrapper to fix build conflicts
// Will be re-enabled once build is stable
export default withContentCollections(withNextIntl(nextConfig));