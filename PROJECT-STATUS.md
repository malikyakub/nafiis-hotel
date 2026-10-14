# Nafiis Hotel — source handoff status

## Fast database answers — 14 October 2026

Routine English questions now bypass Ollama. Fixed anonymous/RLS reads return active room base prices/capacities, available food-menu items and public hotel settings, cached for 30 seconds. Booking/payment guidance uses the hotel guide. Private booking status redirects to protected flows; chat never queries customer records or changes data. Availability remains in the booking form. Other wording/languages use AI fallback and can still be slower.

Eight live direct-answer checks took 26–1,039 ms locally (cached room follow-up: 30 ms); prices/capacities matched the database. Request/session checks and isolated cache coalescing, expiry, failure/recovery and intent-boundary tests passed. Live AI fallback still works. No schema, RLS or grant changes; no service-role key used. See docs/CUSTOMER-CHAT.md for setup, limits and test commands. This is source preparation before deployment.


## Customer AI chatbot — 14 October 2026

Added the Ask Nafiis panel to public/customer routes and a server-only n8n chat bridge. Existing hotel styling and booking, payment and blockchain behavior remain intact. The feature branch is based on the latest predeployment handoff; it does not merge main or dev.

Local validation: live hotel-address and booking-guidance replies, conversation reset/isolation, request validation, TypeScript and production build passed. New server-only configuration was absent from 135 browser bundles. An optional provider-failure simulation was blocked by automatic approval review and was not performed.

See docs/CUSTOMER-CHAT.md for setup. No credentials or local environment files are included. The existing n8n workflow was configured locally, not deployed with this commit. Public use still requires hosted n8n/Ollama over HTTPS, endpoint authentication/gateway limits, server-only host configuration and a compatible function timeout. No production website deployment is included.


## Latest source update — 13 October 2026

The owner requested publishing the remaining local hotel work for partner review. This update includes password-only login for all roles, signup-only email codes, receipt/transaction-number validation, front-desk availability/capacity checks, report date validation, housekeeping filters and the three workstream reviews. Existing frontend styling and assets are preserved. Recovery and role/session checks remain intact.

Previously completed local verification: login/logout and guest access isolation passed; TypeScript and the production build passed on 13 October. No new tests were run for this source upload. Signup email delivery remains deferred. The review documents record unresolved database capacity/expiry guards and acceptance work; the project is not described as production-ready.

Hosting: the user's new Netlify project is `nafiis-hotel-anzaar`, owned by team `anzaarx`. It has no verified application deployment. Required private environment settings, new Supabase redirects and hosted checks remain pending. Existing Supabase URLs still target `https://nafiis-hotel.netlify.app/` plus supported local callbacks. The earlier Netlify preview failed and Vercel was blocked; their underlying reasons could not be read with the available account access.

Source target: existing `feature/predeployment-handoff`, with PR #6 available for partner review. This upload does not merge main, deploy production or publish ChatGPT Sites. Earlier sections below describe the preceding configuration-only handoff and are superseded where they say newer local source is excluded.

Updated 13 October 2026. This snapshot records the production configuration task. The coordinating workspace retains the complete local project history separately.

## Supabase configuration — saved and verified

The project is yiiuvkvyhhgzveqpglzt. Site URL is `https://nafiis-hotel.netlify.app/`, replacing the invalid local wildcard value. Nine exact redirect entries were saved and verified after reloading the dashboard: `/auth/callback`, `/auth/callback?next=/guest`, and `/auth/callback?next=/reset-password` under the production origin, `http://127.0.0.1:4176`, and `http://localhost:4176`. The previous allowlist was empty, so no entries were removed. No email was sent and no account/password was changed.

## Hosting configuration — blocked by account access

The canonical Netlify address was confirmed in the live browser. Netlify production environment values have not been saved or verified because the site owner's account was signed out and they could not complete sign-in. Required names and private-entry instructions are in `docs/DEPLOYMENT-READINESS.md`. Existing private values are kept locally; no credentials are included in this handoff. No new key was generated or rotated.

The coordinating workspace's `.openai/hosting.json` points to the separate Nafiis Hotel Demo on ChatGPT Sites. It is not the hotel's Netlify project and received no hotel environment values. Its metadata, source and audience were preserved.

## Code verification

The production-origin check passed against the existing URL/origin helpers: a trailing-slash SITE_URL becomes the canonical HTTPS Origin, callback/reset URLs use one separator, and upload checks accept that origin while denying foreign, HTTP and local production origins. This check does not inspect remote hosting values or replace hosted login/reset/upload acceptance. See `contracts/scripts/check-production-origin.mjs`.

## Source publication scope

This commit contains production configuration documentation, environment-template comments, the origin verifier and this status snapshot. Other local authentication, payment, operations and blockchain changes are not included. In particular, this branch still has its earlier authentication implementation; do not infer that all newer local login changes have been synchronized.

Publication target: existing `feature/predeployment-handoff` branch in `malikyakub/nafiis-hotel`. The user authorized source publication for this task. This status records intended publication scope; the coordinating workspace will record the actual commit/push result after verification.

## Remaining work

- Obtain Netlify owner/editor access, privately configure required environment values and verify saved production SITE_URL.
- Publish the updated application only in a separately authorized deployment, then verify hosted sign-in, recovery redirects and receipt uploads.
- Signup email-provider/SMTP setup remains deferred separately.

No hosting deployment or Sites publication was performed as part of this configuration/source handoff. Source synchronization, hosting settings and publication are separate operations.
