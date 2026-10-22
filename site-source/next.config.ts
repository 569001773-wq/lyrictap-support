import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/lyrictap-support",
  trailingSlash: true,
  images: { unoptimized: true },
};
export default nextConfig;
