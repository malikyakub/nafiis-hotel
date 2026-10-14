# Customer AI chat

The public hotel pages and customer dashboard now include an **Ask Nafiis** panel. It reuses the existing palette, Button and Field components. Customers can ask questions without signing in, use suggested questions, start a new conversation, follow the existing booking form, or call reception. Closing the panel keeps the conversation while the application stays mounted; a full reload clears the displayed transcript. No chat text is persisted in browser storage.

`POST /api/chat` first answers routine questions directly. Room rates/capacities, menu items and basic hotel location/contact details come from fixed, read-only database queries. Booking/payment guidance and privacy/policy boundaries use the approved hotel guide. Only unmatched questions go to the existing n8n Chat Trigger with the question and a server-issued conversation ID. It never forwards hotel login cookies, account records, booking records, payment proofs or wallet credentials. React renders answers as plain text, without interpreting model HTML or links. `DELETE /api/chat` starts a new conversation; it does not erase n8n execution logs or old memory.

## Fast answers

- Reads use the public anonymous Supabase client, even when the caller is signed-in staff. Existing RLS remains active. No service key, caller's database session, schema change or permission grant is used.
- Only active room types (`name, booking_code, base_price, capacity`), available food (`name, category, price`) and public hotel settings (`name, address, phone, email`) are read. Questions never become SQL, table names or arbitrary filters. Customer/payment tables are never queried.
- Public results are cached for 30 seconds per process, with concurrent reads sharing a pending request. Database requests time out after four seconds. Errors are not cached and expired results are not served on failure. A lookup failure returns an honest reception/website message without waiting for AI or inventing prices.
- Listed base rates are not a date-specific quote or proof of availability. Live availability still uses the existing booking form. Missing database contact fields fall back to the existing public website contact details. Unapproved policy placeholders are not quoted.
- English routine questions bypass inference; other wording/languages can use the AI fallback. Fast exchanges are not added to n8n memory, so use explicit questions for cross-mode follow-ups. Responses include `source` (`database`, `hotel-guide`, or `ai`) for verification.
- Local read-only measurements on 14 October 2026: eight routine queries took 26–1,039 ms, including first database reads; cached room follow-up took 30 ms. These are observed local timings, not a production latency guarantee.

## Configuration

- `HOTEL_CHAT_WEBHOOK_URL`: needed only for AI fallback. n8n production Chat URL, with Make Chat Publicly Available enabled and Embedded Chat mode. Production must use HTTPS reachable by the hosting server. A laptop's localhost URL works only when Next.js and n8n run on that same computer. Routine answers work independently of n8n availability.
- `HOTEL_CHAT_SESSION_SECRET`: random server-only secret of at least 32 characters; use the same value on every application instance. Local development has a process-only fallback. Never use NEXT_PUBLIC_ variables for these settings.
- `HOTEL_CHAT_BASIC_AUTH`: optional matching n8n Basic Auth `username:password`. Protect a hosted n8n endpoint with authentication and gateway limits before internet rollout. The local workflow currently uses no authentication and is bound to the existing local n8n service; no tunnel was created.

The n8n workflow is `hotel costumer ai support copy` (UvPlbyBXwTPiGY7q), with Ollama `llama3.2:3b` and Simple Memory. Its system instruction contains the project's public location/contact/amenities and booking/payment guidance. Update those facts when the hotel content changes. AI answers may still be inaccurate; prices, availability and policies must be confirmed through the existing hotel flows or reception.

## Boundaries and operations

- Chat is informational. Its fixed public-data reads cannot create bookings, access private accounts, change payments or write blockchain transactions. The AI itself has no database/transaction tools. Existing hotel role checks and payment review flows are unchanged.
- Request origin is checked, actual body size is limited to 8 KB, questions to 1,000 characters, and responses to 32 KB. Upstream requests time out after 80 seconds; the client allows 95 seconds. Configure the hosting function timeout to support this, or use a faster inference service.
- A signed, HttpOnly, SameSite=Strict session cookie isolates conversations. Production cookies are Secure. New chat rotates conversation identity but keeps the visitor rate bucket.
- In-process limits: 20 messages per visitor per 10 minutes, 30 requests/minute globally and 3 concurrent inference requests per process. They reset on restart and are not a distributed quota. Use a shared gateway/rate-limit service for public deployment. n8n's direct endpoint must also be protected; the Next.js limits do not cover direct calls to it.
- Only AI-fallback questions are sent to your n8n/Ollama service and can appear in n8n execution history and memory. Routine questions are handled in the website server. Configure n8n retention and access appropriately. Do not send payment details, passwords or wallet keys in chat.
- Source from `feature/ai-chatbot` is now included directly in `feature/full-integration` at the owner's request. Publishing source does not deploy the hotel website, create public networking/tunnels, configure production secrets or change existing booking/blockchain data.

Run the non-model API contract checks against the local development server with `node contracts/scripts/check-chat.mjs`.
Run `node contracts/scripts/check-chat-cache.mjs` for isolated routing/cache expiry/failure tests and `node --env-file=.env.local contracts/scripts/check-chat-fast.mjs` for read-only database equality and endpoint speed checks.

Integration follows the [n8n Chat Trigger documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chattrigger/).
