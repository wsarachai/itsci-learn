import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // ตอน `npm run dev` ไม่มี Caddy คอยส่ง /api ไป Spring Boot จึงให้ Next.js ส่งต่อเอง
  // ตอน production (Docker) Caddy จัดการ /api ก่อนถึง Next.js อยู่แล้ว
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    const api = process.env.API_URL ?? "http://localhost:8080";
    return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
  },
};

export default nextConfig;
