# Nafiis Hotel — source handoff status

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
