# Customer AI chat

The public hotel pages and customer dashboard now include an **Ask Nafiis** panel. It reuses the existing palette, Button and Field components. Customers can ask questions without signing in, use suggested questions, start a new conversation, follow the existing booking form, or call reception. Closing the panel keeps the conversation while the application stays mounted; a full reload clears the displayed transcript. No chat text is persisted in browser storage.

`POST /api/chat` forwards only the customer's question and a server-issued conversation ID to the existing n8n Chat Trigger. It never forwards hotel login cookies, account records, booking records, payment proofs or wallet credentials. React renders answers as plain text, without interpreting model HTML or links. `DELETE /api/chat` starts a new conversation; it does not erase n8n execution logs or old memory.

## Configuration

- `HOTEL_CHAT_WEBHOOK_URL`: n8n production Chat URL, with Make Chat Publicly Available enabled and Embedded Chat mode. Production must use HTTPS reachable by the hosting server. A laptop's localhost URL works only when Next.js and n8n run on that same computer.
- `HOTEL_CHAT_SESSION_SECRET`: random server-only secret of at least 32 characters; use the same value on every application instance. Local development has a process-only fallback. Never use NEXT_PUBLIC_ variables for these settings.
- `HOTEL_CHAT_BASIC_AUTH`: optional matching n8n Basic Auth `username:password`. Protect a hosted n8n endpoint with authentication and gateway limits before internet rollout. The local workflow currently uses no authentication and is bound to the existing local n8n service; no tunnel was created.

The n8n workflow is `hotel costumer ai support copy` (UvPlbyBXwTPiGY7q), with Ollama `llama3.2:3b` and Simple Memory. Its system instruction contains the project's public location/contact/amenities and booking/payment guidance. Update those facts when the hotel content changes. AI answers may still be inaccurate; prices, availability and policies must be confirmed through the existing hotel flows or reception.

## Boundaries and operations

- Chat is informational. It has no Supabase, booking, payment or blockchain tools and performs no transactions. Existing hotel role checks and payment review flows are unchanged.
- Request origin is checked, actual body size is limited to 8 KB, questions to 1,000 characters, and responses to 32 KB. Upstream requests time out after 80 seconds; the client allows 95 seconds. Configure the hosting function timeout to support this, or use a faster inference service.
- A signed, HttpOnly, SameSite=Strict session cookie isolates conversations. Production cookies are Secure. New chat rotates conversation identity but keeps the visitor rate bucket.
- In-process limits: 20 messages per visitor per 10 minutes, 30 requests/minute globally and 3 concurrent inference requests per process. They reset on restart and are not a distributed quota. Use a shared gateway/rate-limit service for public deployment. n8n's direct endpoint must also be protected; the Next.js limits do not cover direct calls to it.
- Chat messages are sent to your n8n/Ollama service and can appear in n8n execution history and memory. Configure n8n retention and access appropriately. Do not send payment details, passwords or wallet keys in chat.
- This task does not deploy the hotel website, create public networking/tunnels, configure production secrets, push source, or change existing booking/blockchain data.

Run the non-model API contract checks against the local development server with `node contracts/scripts/check-chat.mjs`.

Integration follows the [n8n Chat Trigger documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chattrigger/).
