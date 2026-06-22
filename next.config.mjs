// @ts-check

/**
 * Next.js config — fully static export.
 *
 * Velite is invoked here (at config evaluation) so it runs under both the
 * Turbopack dev server and the production export build. The guard env var
 * keeps it from starting twice when Next reloads the config.
 */
const isDev = process.argv.includes('dev');
const isBuild = process.argv.includes('build');

if (!process.env.VELITE_STARTED && (isDev || isBuild)) {
  process.env.VELITE_STARTED = '1';
  const { build } = await import('velite');
  await build({ watch: isDev, clean: !isDev });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static site: emit a static export to ./out. No server runtime.
  output: 'export',
  reactStrictMode: true,
  // next/image cannot use the optimization server in a static export.
  images: { unoptimized: true },
  // Stable, crawlable URLs as directories with index.html.
  trailingSlash: true,
  eslint: {
    // Lint is run explicitly via `bun run lint`; don't fail the export on it.
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
