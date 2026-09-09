import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Conquistador Oil",
    short_name: "Conquistador",
    description: "Heating oil delivery, commercial fuel delivery, HVAC service requests, and emergency heating help for Lancaster and Central Pennsylvania.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4eadb",
    theme_color: "#0b2f4a",
    icons: [
      {
        src: "/brand/conquistador-oil-logo.png",
        sizes: "512x462",
        type: "image/png"
      }
    ]
  };
}
