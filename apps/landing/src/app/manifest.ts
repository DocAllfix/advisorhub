import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FinBeacon",
    short_name: "FinBeacon",
    description: "Analisi di bilancio e allerta crisi per gli studi commercialisti.",
    lang: "it",
    start_url: "/",
    display: "browser",
    background_color: "#f8fafd",
    theme_color: "#f8fafd",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
