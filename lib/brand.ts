// Brand facts and contact details (design: "Coral Stone & Ocean"). M.K signs off the final branding
// (Dev Tasks TASK-44). UI colours live in app/globals.css; `colors` below is only for places CSS
// can't reach (viewport theme colour, emails, OG images, PDF receipts).
export const brand = {
  name: "Nafiis",
  tagline: "Hotel in Mogadishu",
  meaning: "Somali for precious",
  city: "Mogadishu",
  contact: {
    street: "Jalle Siyaad Street",
    district: "Dharkeynley District",
    country: "Somalia",
    // Shown as written; `phoneHref` is the same number for tel: links.
    phone: "+252 613 67 37 34",
    phoneHref: "+252613673734",
    email: "malikyakub@hotmail.com",
    airportMinutes: 10,
  },
  colors: {
    brand: "#0E4A68",
    accent: "#B03F28",
    foreground: "#14202B",
    background: "#F7F3EC",
  },
} as const;
