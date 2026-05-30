import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Conquistador Oil",
    short_name: "Conquistador",
    description: "Fuel delivery, heating, and HVAC service requests for Lancaster and Central Pennsylvania.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#0f4c45"
  };
}
