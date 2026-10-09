# Deployment readiness

## Current handoff - 2026-10-09

This section supersedes the historical preparation snapshots below. Amoy is funded and deployed; demo receipt approval, real booking proof confirmation and check-in passed. Customer isolation and concurrent booking checks passed. The bounded receipt parser regression, TypeScript and production build also passed. See `ACCEPTANCE-RESULTS.md` for evidence and limits.

Still required: final hosting origin/environment, Supabase auth redirect setup and hosted login/reset/booking checks; demo checkout; receptionist/rejection workflow; elapsed-expiry boundary; review leaked-password protection. Three receptionist emails are pending. GitHub upload is deferred and no hosting deployment has occurred. The existing source ZIP is for source handoff, not static drag-and-drop hosting.

## Latest deployment status

Amoy contract deployed and verified on 2026-10-08: 0x1AedE4EB72E3798F1Ed6fDa8752658E4eCA1E9A9. Deployment transaction: https://amoy.polygonscan.com/tx/0x1343cbbea63bd37bcb1ed70013259bf44a8d2590d92e830cf0fff91bb4744fd9. Script verified successful receipt, at least three confirmations, canonical block, deployed code and matching registrar. Owner funded the wallet with 0.1 test POL. Public RPC batching caused the first attempt to fail before signing; deployment now uses individual requests. Saved PROOF_REGISTRY_ADDRESS locally and development server reloaded .env.local. No real money used. The booking-to-chain workflow has not yet been exercised; no existing booking was changed by deployment.

Earlier setup notes below are historical where they say funding or deployment is missing. Host environment configuration is still required separately.


Updated 2026-10-08. This is the original Next.js application, not the older root static website. GitHub upload and online deployment remain deferred.

## Completed preparation

- 30 demo rooms: Room 001–010 Garden ($75, 2 guests), Room 011–018 Ocean ($95, 2 guests), Room 019–030 Family suite ($160, 5 guests).
- Account-optional booking and private screenshot uploads, staff review, customer history and management portals.
- New unpaid reservations hold a room for 30 minutes. A database temporal exclusion constraint prevents overlapping active holds/reservations. Expired holds remain in history but no longer block inventory; their payment uploads are rejected. Successful submission before expiry keeps the room reserved for review. Repeating an expired checkout creates a fresh booking.
- A countdown appears on the private payment page; expired payment instructions and upload controls are hidden. Guests who already paid after expiry must have the hotel resolve the payment before paying again.
- Production authentication redirects and mutation origin checks require the operator's exact HTTPS `SITE_URL`. Arbitrary forwarded hosts are not accepted.

## Hosting setup still required

Use a host supporting Next.js server rendering, route handlers and server actions; a static file upload is insufficient. Select this Next.js directory as the project root. Build: `npm run build`. For a Node server: `npm start`; managed Next.js hosts provide their own runtime.

Set the two public Supabase variables from `.env.example` and the server-only Supabase secret in the host's environment settings. Set `SITE_URL` to the chosen HTTPS origin. Never put server keys in `NEXT_PUBLIC_` values, source, screenshots or chat. Revoke any previously exposed private key in Supabase and use a replacement; rotation is not verified.

Set Supabase Authentication → URL Configuration → Site URL to that same origin. Allow the exact `/auth/callback` URL (and the reset callback with `?next=/reset-password` if the dashboard requires an exact match). Keep local redirects only while developing. Use a fresh confirmation/reset email after changes, in the browser that initiated the request.

The current public booking rate limit uses Netlify's trusted client-IP header on Netlify. Other hosts deliberately share a five-bookings/hour fallback bucket; configure a trusted host-specific client-IP strategy before using another provider for multiple guests. Do not trust arbitrary `X-Forwarded-For` input.

Receipt upload limit is 4 MB, leaving room for multipart/base64 overhead within Netlify function limits. Uploaded receipts remain in private Supabase Storage.

## Blockchain activation still required

Latest local preparation: wallet and public RPC are now configured. Public wallet address: `0x67f13E9D8308ef33E7Bc9990Fd1F577e0D701485`; verified chain 80002, balance 0 test POL. Funding from the faucet is the immediate blocker. The faucet browser is at security verification. After the owner requests test POL, deploy the registry and finish the real-chain acceptance flow. Private key remains in ignored `.env.local` and is not included in source delivery.

Enter `AMOY_RPC_URL` and a dedicated test wallet's `SYSTEM_WALLET_PRIVATE_KEY` locally. Fund the wallet with Amoy test POL, run `./deploy-blockchain.ps1`, then set the returned `PROOF_REGISTRY_ADDRESS` locally and on the host. See `BLOCKCHAIN.md`. No real transaction or contract deployment has been performed.

Staff verifies the actual mobile-money receipt/funds; blockchain records the approved booking proof. It does not determine whether a screenshot is genuine. Customer wallets and cryptocurrency payments are not used. Keep a staff portal open or use Check blockchain proof to reconcile pending transactions; there is no unattended worker. Reverted/stuck transactions require operator attention.

## Acceptance checks still required before public use

- Create a booking without an account, confirm its deadline and room/category, then check another browser cannot access its receipt page by ID alone.
- Submit a demo-labelled receipt before expiry; admin/reception should see it privately. Do not transfer real money just to test.
- Verify rejection requires a note and cancels the booking. Verify approval remains under review until a real Amoy proof is confirmed.
- After blockchain activation, confirm explorer transaction, check-in and check-out. Verify guests cannot use staff endpoints or view another guest's records.
- Check expired holds, simultaneous bookings for the same room and matching dates, mobile layout, and production reset/confirmation links.
- Add up to three receptionists using verified account emails when provided. Administrator: zizoubariise@gmail.com. Do not restore the removed administrator-email-change control.

Database advisors: RLS without policies on the three server-only job/lease/rate-limit tables is intentional. Availability is an intentional public SECURITY DEFINER function; role/guest helpers are caller-specific and receptionist management requires admin. Supabase leaked-password protection remains disabled; review https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection before launch.

Compilation or schema inspection does not establish that these end-to-end checks passed.

## Compilation and dependency review

Final Next.js 16.3.8 production build passed on 2026-10-08, including TypeScript and 27 generated pages. Next.js and its lint config were patched to 16.3.8; source-map-js was patched to 1.2.2. The production-only npm audit reports zero known vulnerabilities. Full audit retains five high development-only lint dependency findings in the braces/micromatch/fast-glob chain; npm suggests a major lint-config downgrade, which was not applied. No end-to-end tests or live blockchain transaction were run.

Netlify preparation (2026-10-09): netlify.toml is included. Use the original Next.js project as the root, configure environment values in Netlify, and let Netlify select its Next.js adapter. See https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/ and https://docs.netlify.com/build/functions/configuration/. This is preparation only; deployment and auth redirect checks remain pending.

Run npm run deployment:check locally or in the configured host environment. It validates required settings without printing values, exact HTTPS origin, Amoy chain, deployed registry, registrar and nonzero wallet balance. Current local result: SITE_URL missing. This does not replace the hosted login/reset and booking checks.
