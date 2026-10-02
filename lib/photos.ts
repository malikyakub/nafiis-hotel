// Stock photos (Unsplash License: free for commercial use, no attribution required) standing in
// until the hotel provides its own. Served from public/photos: fetching from Unsplash at request
// time could outlast the image optimiser's timeout. `page` is the Unsplash photo page, kept for
// credit and re-download.

export type SitePhoto = { src: string; alt: string; page: string };

export const photos = {
  authPanel: {
    src: "/photos/auth-panel.jpg",
    alt: "Lido beach in Mogadishu on a clear day, with the ocean meeting white sand.",
    page: "https://unsplash.com/photos/a-beach-with-people-on-it-C4TvJFvtgiw",
  },
  oceanRoom: {
    src: "/photos/ocean-room.jpg",
    alt: "Hotel room with a wooden table and chairs, its glass doors open onto the sea.",
    page: "https://unsplash.com/photos/brown-wooden-table-and-chairs-near-sea-during-daytime-56WKMCORs-0",
  },
  gardenRoom: {
    src: "/photos/garden-room.jpg",
    alt: "Bright twin room with two beds and large windows overlooking a garden.",
    page: "https://unsplash.com/photos/bedroom-with-two-beds-and-large-windows-overlooking-garden-T0pcSrFn9Qo",
  },
  familySuite: {
    src: "/photos/family-suite.jpg",
    alt: "Spacious suite with a large bed, a seating area and windows onto greenery.",
    page: "https://unsplash.com/photos/spacious-hotel-room-with-a-large-bed-and-scenic-view-yTOvgPo6470",
  },
  restaurant: {
    src: "/photos/restaurant.jpg",
    alt: "Overhead view of a woven table spread with rice, stews, flatbread and small bowls of sauce.",
    page: "https://unsplash.com/photos/a-table-topped-with-lots-of-different-types-of-food-q9TtiGa5yJQ",
  },
  city: {
    src: "/photos/city.jpg",
    alt: "View over Mogadishu's white rooftops towards the coast.",
    page: "https://unsplash.com/photos/a-view-of-a-city-with-tall-buildings-XzWkVZKqU0M",
  },
  lobby: {
    src: "/photos/lobby.jpg",
    alt: "Hotel lobby with cream sofas, a patterned carpet and a long view to the dining room.",
    page: "https://unsplash.com/photos/a-hotel-lobby-with-couches-chairs-and-a-chandelier-NNvFZeMbm84",
  },
  reception: {
    src: "/photos/reception.jpg",
    alt: "Reception desk in warm wood under a curved, softly lit ceiling.",
    page: "https://unsplash.com/photos/hotel-reception-desk-with-modern-wooden-furniture-and-seating-kfnWOD1Tbp8",
  },
  lounge: {
    src: "/photos/lounge.jpg",
    alt: "Lounge with a curved white sofa, orange cushions and a round rug.",
    page: "https://unsplash.com/photos/a-living-room-with-a-couch-and-a-coffee-table-teaMcALMtto",
  },
  feast: {
    src: "/photos/feast.jpg",
    alt: "Breakfast table with fresh fruit, a curry pot, eggs and toast.",
    page: "https://unsplash.com/photos/a-table-full-of-food-FMMaiSQ_pbw",
  },
  catch: {
    src: "/photos/catch.jpg",
    alt: "Fishermen carrying a large fish up the beach in Mogadishu.",
    page: "https://unsplash.com/photos/men-carry-large-fish-on-a-beach-4Ut-HgBKs_s",
  },
  lidoBoats: {
    src: "/photos/lido-boats.jpg",
    alt: "White sand and small boats at low tide on Lido beach.",
    page: "https://unsplash.com/photos/a-beach-with-boats-and-people-dlSMqiBeVxU",
  },
  lidoShore: {
    src: "/photos/lido-shore.jpg",
    alt: "People walking down to the sea on Lido beach under a blue sky.",
    page: "https://unsplash.com/photos/a-beach-with-people-and-cars-Gyj0comWwCQ",
  },
  cityNight: {
    src: "/photos/city-night.jpg",
    alt: "Mogadishu at night, a lit avenue running between tall buildings.",
    page: "https://unsplash.com/photos/a-view-of-a-city-at-night-from-the-top-of-a-building-xTVfYzslsts",
  },
} satisfies Record<string, SitePhoto>;
