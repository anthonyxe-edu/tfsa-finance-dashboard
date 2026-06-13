import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile elsewhere on the machine
  // isn't mistaken for the project root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
