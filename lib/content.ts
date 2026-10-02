import {
  AirVent,
  Bath,
  BedDouble,
  CalendarCheck,
  ConciergeBell,
  Coffee,
  Eye,
  Laptop,
  Plane,
  ReceiptText,
  Sofa,
  Sparkles,
  Trees,
  Tv,
  UtensilsCrossed,
  Users,
  Waves,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { brand } from "./brand";
import { photos, type SitePhoto } from "./photos";

// Public-site content in one place, so every page tells the same story. Moves to the database
// (room types, menu) once the DB agent adds those tables; the pages only read from here.
// Copy is placeholder until the hotel signs it off.

// DEMO VALUES: realistic stand-ins so the site reads as finished. None of these are confirmed by
// the hotel; replace them here (and nowhere else) once it supplies the real figures.
export const DEMO = {
  checkIn: "14:00",
  checkOut: "12:00",
  receptionHours: "24 hours, every day",
  breakfastHours: "06:30–10:30",
  kitchenHours: "12:00–22:30",
  totalRooms: 32,
  openedYear: 2019,
  cancellation: "Free cancellation up to 48 hours before check-in. After that, the first night is charged.",
  restaurantOpen: "Yes. The restaurant is open to everyone for breakfast, lunch and dinner, no booking needed.",
} as const;

// Times offered in the quick booking card: from check-in time to late evening, and early
// morning up to check-out time.
export const CHECK_IN_TIMES = ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];
export const CHECK_OUT_TIMES = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00"];

// Prices in US dollars, the currency hotels in Mogadishu quote in.
export const usd = (amount: number) => `$${amount}`;

type Feature = { icon: LucideIcon; text: string };

export type Room = {
  slug: string;
  // Room type sent by the quick booking form (ROOM_TYPES in app/(public)/actions.ts).
  bookingType: string;
  name: string;
  photo: SitePhoto;
  // Per night, USD.
  price: number;
  specs: string;
  summary: string;
  description: string[];
  facts: Feature[];
  amenities: Feature[];
};

// In every room type.
export const SHARED_AMENITIES: Feature[] = [
  { icon: Wifi, text: "Fast Wi-Fi" },
  { icon: AirVent, text: "Air conditioning" },
  { icon: Sparkles, text: "Daily housekeeping" },
  { icon: ConciergeBell, text: "Room service" },
  { icon: Bath, text: "Private bathroom" },
  { icon: Tv, text: "Television" },
];

export const ROOMS: Room[] = [
  {
    slug: "ocean-room",
    bookingType: "ocean",
    name: "Ocean room",
    photo: photos.oceanRoom,
    price: 95,
    specs: "King bed · Sea view · 28 m²",
    summary: "Wide windows onto the water, with a desk for working stays.",
    description: [
      "Wake to the Indian Ocean. The ocean room faces the water, with wide windows that open to the sea breeze and a king bed set to look out on it.",
      "A proper desk and fast Wi-Fi make it the room of choice for working stays, and the kitchen is a phone order away.",
    ],
    facts: [
      { icon: BedDouble, text: "King bed" },
      { icon: Users, text: "Up to 2 guests" },
      { icon: Waves, text: "Sea view" },
    ],
    amenities: [...SHARED_AMENITIES, { icon: Laptop, text: "Work desk" }],
  },
  {
    slug: "garden-room",
    bookingType: "garden",
    name: "Garden room",
    photo: photos.gardenRoom,
    price: 75,
    specs: "Twin or king · Courtyard · 24 m²",
    summary: "Quiet side of the hotel, shaded by the courtyard trees.",
    description: [
      "On the quiet side of the hotel, the garden room looks over the shaded courtyard. Choose twin beds or a king when you book.",
      "A calm base for longer stays, away from the street and close to the restaurant.",
    ],
    facts: [
      { icon: BedDouble, text: "Twin or king" },
      { icon: Users, text: "Up to 2 guests" },
      { icon: Trees, text: "Courtyard view" },
    ],
    amenities: [...SHARED_AMENITIES, { icon: Coffee, text: "Tea and coffee" }],
  },
  {
    slug: "family-suite",
    bookingType: "family",
    name: "Family suite",
    photo: photos.familySuite,
    price: 160,
    specs: "King + twin · Lounge · 52 m²",
    summary: "Two rooms and a lounge for families staying longer.",
    description: [
      "Room for everyone. The family suite has a king bedroom, a twin room for the children and a lounge to gather in between.",
      "Meals can come to the suite, and housekeeping works around your day.",
    ],
    facts: [
      { icon: BedDouble, text: "King + twin" },
      { icon: Users, text: "Up to 5 guests" },
      { icon: Sofa, text: "Separate lounge" },
    ],
    amenities: [...SHARED_AMENITIES, { icon: Eye, text: "Garden views" }],
  },
];

export const ROOM_OPTIONS = [
  { value: "any", label: "Any room" },
  ...ROOMS.map((room) => ({ value: room.bookingType, label: room.name })),
];

export const roomBySlug = (slug: string) => ROOMS.find((room) => room.slug === slug);

// Only services the site already promises elsewhere (rooms lead, restaurant, location).
export const STAY: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Wifi, title: "Fast Wi-Fi", text: "Stay connected for work or calls home, throughout the hotel." },
  { icon: AirVent, title: "Air conditioning", text: "Cool, quiet rooms whatever the weather outside." },
  { icon: Sparkles, title: "Daily housekeeping", text: "Fresh linen and a tidy room, every day of your stay." },
  { icon: ConciergeBell, title: "Room service", text: "Meals from our kitchen, brought to your door." },
  { icon: Plane, title: "Airport pickup", text: `On request. We are ${brand.contact.airportMinutes} minutes from Aden Adde International.` },
  { icon: CalendarCheck, title: "Simple booking", text: "Book online in minutes and pay at reception or online." },
];

export const RESTAURANT_POINTS: Feature[] = [
  { icon: UtensilsCrossed, text: "Somali and coastal dishes, cooked to order" },
  { icon: ConciergeBell, text: "Room service for staying guests" },
  { icon: ReceiptText, text: "Added to your bill, itemised" },
];

export type MenuItem = { name: string; text: string; price: string };

export const MENU: { id: string; label: string; hours: string; items: MenuItem[] }[] = [
  {
    id: "breakfast",
    label: "Breakfast",
    hours: DEMO.breakfastHours,
    items: [
      { name: "Canjeero", text: "Somali pancake with honey and ghee, or with liver and onions.", price: usd(3) },
      { name: "Beer iyo canjeero", text: "Sautéed liver with peppers and onion, served with canjeero.", price: usd(5) },
      { name: "Eggs your way", text: "Fried, scrambled or as an omelette, with bread and salad.", price: usd(4) },
      { name: "Fresh fruit plate", text: "Papaya, mango, banana and lime, as the market allows.", price: usd(3) },
    ],
  },
  {
    id: "mains",
    label: "Mains",
    hours: DEMO.kitchenHours,
    items: [
      { name: "Bariis iskukaris", text: "Spiced rice with tender goat or chicken, raisins and banana on the side.", price: usd(9) },
      { name: "Grilled fish", text: "The morning catch, grilled with lime and spices, with rice or chips.", price: usd(12) },
      { name: "Suqaar", text: "Small cubes of beef stir-fried with peppers and onion.", price: usd(8) },
      { name: "Baasto", text: "Pasta with a rich Somali-spiced meat sauce.", price: usd(7) },
    ],
  },
  {
    id: "drinks",
    label: "Drinks",
    hours: "All day",
    items: [
      { name: "Shaah", text: "Somali spiced tea with cardamom, cinnamon and cloves.", price: usd(1) },
      { name: "Fresh juice", text: "Mango, papaya, lemon or a mix, pressed to order.", price: usd(3) },
      { name: "Coffee", text: "Black, with milk or spiced.", price: usd(2) },
      { name: "Water and soft drinks", text: "Chilled, still or sparkling.", price: usd(1) },
    ],
  },
];

export type GalleryItem = { photo: SitePhoto; category: "Hotel" | "Rooms" | "Dining" | "Mogadishu"; caption: string };

// Ordered for the home page, which shows the first seven.
export const GALLERY: GalleryItem[] = [
  { photo: photos.lobby, category: "Hotel", caption: "The lobby" },
  { photo: photos.oceanRoom, category: "Rooms", caption: "Ocean room" },
  { photo: photos.feast, category: "Dining", caption: "Breakfast" },
  { photo: photos.lidoBoats, category: "Mogadishu", caption: "Lido beach at low tide" },
  { photo: photos.reception, category: "Hotel", caption: "Reception" },
  { photo: photos.catch, category: "Mogadishu", caption: "The morning catch" },
  { photo: photos.familySuite, category: "Rooms", caption: "Family suite" },
  { photo: photos.lounge, category: "Hotel", caption: "The lounge" },
  { photo: photos.restaurant, category: "Dining", caption: "Somali dishes, cooked to order" },
  { photo: photos.gardenRoom, category: "Rooms", caption: "Garden room" },
  { photo: photos.cityNight, category: "Mogadishu", caption: "The city at night" },
  { photo: photos.lidoShore, category: "Mogadishu", caption: "Down to the sea" },
  { photo: photos.city, category: "Mogadishu", caption: "Rooftops to the coast" },
  { photo: photos.authPanel, category: "Mogadishu", caption: "Lido beach" },
];

export type Faq = { question: string; answer: string };

export const FAQ: Faq[] = [
  {
    question: "Do I need an account to book?",
    answer: "No. Book with your name and phone number. After booking you can save your details for next time, but you never have to.",
  },
  {
    question: "What are the check-in and check-out times?",
    answer: `Check-in is from ${DEMO.checkIn} and check-out is by ${DEMO.checkOut}. You choose your arrival time when you book; ask reception if you need to arrive earlier or leave later.`,
  },
  {
    question: "How can I pay?",
    answer: "At reception when you arrive, or online. Restaurant orders made during your stay are added to your bill, itemised.",
  },
  {
    question: "Can you collect me from the airport?",
    answer: `Yes, on request. We are ${brand.contact.airportMinutes} minutes from Aden Adde International Airport. Add your flight details when you book, or call reception.`,
  },
  {
    question: "Can I cancel or change my booking?",
    answer: `${DEMO.cancellation} Call reception and we will help you change your dates.`,
  },
  {
    question: "Is the restaurant open to guests who are not staying?",
    answer: `${DEMO.restaurantOpen} Staying guests can also order to their room from their phone.`,
  },
];
