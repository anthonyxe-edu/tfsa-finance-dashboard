import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finance Dashboard",
    short_name: "Finance",
    description: "Personal TFSA & spending dashboard",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0d0a",
    theme_color: "#0c0d0a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
