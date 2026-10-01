// Brand facts (design: "Coral Stone & Ocean"). M.K signs off the final branding (Dev Tasks TASK-44).
// UI colours live in app/globals.css; the constants below are only for places CSS can't reach
// (viewport theme colour, emails, OG images, PDF receipts).
export const brand = {
  name: "Nafiis",
  tagline: "Hotel in Mogadishu",
  meaning: "Somali for precious",
  city: "Mogadishu",
  colors: {
    brand: "#0E4A68",
    accent: "#B03F28",
    foreground: "#14202B",
    background: "#F7F3EC",
  },
} as const;
