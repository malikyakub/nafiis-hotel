// Deterministic routing: customer text never becomes SQL, a table name or a filter.
export type QuickIntent = "rooms" | "menu" | "location" | "contact" | "booking" | "payment" | "private" | "policy" | "amenities" | "availability" | "greeting";
export function classifyQuestion(message: string): QuickIntent | null {
  const text = message.toLowerCase().replace(/[’']/g, "").trim();
  if (/\b(my|our|someone|another|customer|guest)\b/.test(text) && /\b(booking|reservation|payment|receipt|wallet|password|passport|balance|records|details)\b/.test(text) && !/\b(how|can i|do i|where do)\b/.test(text)) return "private";
  if (/\b(available|availability|vacan(?:t|cy)|free rooms?)\b/.test(text) || (text.match(/\b\d{4}-\d{2}-\d{2}\b/g)?.length === 2)) return "availability";
  if (/\b(check[ -]?in|check[ -]?out|cancel(?:lation)?|refund|early arrival|late departure)\b/.test(text)) return "policy";
  if (/\b(pay(?:ment|ments)?|evc|edahab|receipt|crypto|blockchain)\b/.test(text)) return "payment";
  if (/\b(book(?:ing)?|reserve|reservation)\b/.test(text)) return "booking";
  if (/\b(phone|call|contact|email|telephone|reception number)\b/.test(text)) return "contact";
  if (/\b(where|location|address|located|directions)\b/.test(text) && /\b(hotel|nafiis|you|location|address)\b/.test(text)) return "location";
  if (/\b(wi[ -]?fi|internet|amenities|air conditioning|housekeeping|room service|airport pickup)\b/.test(text)) return "amenities";
  if (/\b(menu|food|restaurant|breakfast|lunch|dinner|coffee|tea|shaah|canjeero|bariis|suqaar|baasto|juice|fish)\b/.test(text)) return "menu";
  if (/\b(rooms?|suites?|nightly|rates?|prices?|cost|capacity|guests?|ocean|garden|family)\b/.test(text)) return "rooms";
  if (/^(hi|hello|hey|good morning|good evening|thanks|thank you)[!.\s]*$/.test(text)) return "greeting";
  return null;
}

export type RoomRow = { name: string; booking_code: string | null; base_price: number | string; capacity: number };
export type MenuRow = { name: string; category: string; price: number | string };
const dollars = (value: number | string) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value));

export function roomAnswer(rows: RoomRow[], question: string) {
  const text = question.toLowerCase();
  const specific = rows.filter(row => (row.booking_code && new RegExp(`\\b${row.booking_code}\\b`).test(text)) || text.includes(row.name.toLowerCase()));
  const selected = specific.length ? specific : rows;
  if (!selected.length) return "There are no active room types listed right now. Please contact reception.";
  return `Current listed base rates:\n${selected.map(row => `${row.name}: ${dollars(row.base_price)} per night, up to ${row.capacity} guests.`).join("\n")}\n\nUse Book a room to check dates and the final booking total. These rates do not confirm availability.`;
}

export function menuAnswer(rows: MenuRow[], question: string) {
  if (!rows.length) return "There are no available menu items listed right now. Please contact reception.";
  const text = question.toLowerCase();
  const specific = rows.filter(row => text.includes(row.name.toLowerCase()));
  const category = rows.filter(row => text.includes(row.category.toLowerCase()));
  const selected = (specific.length ? specific : category.length ? category : rows).slice(0, 20);
  return `Currently listed menu items:\n${selected.map(row => `${row.name}: ${dollars(row.price)}`).join("\n")}\n\nSee Dining for the full menu. Please confirm allergens and dietary requirements with restaurant staff.`;
}
