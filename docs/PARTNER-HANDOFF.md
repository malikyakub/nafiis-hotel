# Partner handoff — 9 October 2026

## Scope and completed work

Preserve the original design at https://nafiis-hotel.netlify.app/. The owner approved the three-step booking flow and email-code screens. This repository is the Next.js application; the older standalone static demo is a different implementation.

Implemented: 30 rooms (001–010 Garden, 011–018 Ocean, 019–030 Family), guest checkout without registration, browser-bound private receipt upload, EVC/eDahab instructions, staff payment approval/rejection, room/food management, customer history, check-in/out and booking-only Amoy proofs.

Verified: TypeScript/production build, upload limits, request origins/private cookies, customer ownership/disabled-account restrictions, concurrent booking exclusion and an actual labelled demo through Amoy proof and checkout. No real payment. Local staff-route suites use dependency doubles and are not live receptionist acceptance. See ACCEPTANCE-RESULTS.md.

## Remaining tasks

1. **Registration email delivery, deferred by owner:** connect custom SMTP and update the Confirm signup template. Login uses email/password and needs no OTP delivery. Follow EMAIL-VERIFICATION.md; enter secrets privately in the provider/dashboard. Password recovery retains its existing verification flow.
2. **Staff acceptance:** exercise a real receptionist session and receipt rejection/cancellation/room release with labelled demo data. Three receptionist email addresses are pending; admin adds verified users through the portal.
3. **Elapsed expiry and contention:** apply docs/booking-expiry-24h.sql, then verify first-receipt-wins between two guests and the 24-hour unpaid expiry (or a booking with an older created_at). Payment approval is administrator only.
4. **Hosting:** configure final HTTPS SITE_URL, environment secrets and Supabase callback/reset URLs; test login/register/reset and booking/payment/proof on the final domain.
5. **Security:** review disabled leaked-password protection and development-only lint advisories. Owner rotation of previously exposed private credentials is not verified.

## Shared database and blockchain

The shared Supabase project already has applied changes. Do not reset it or rerun all SQL files. docs/*.sql includes historical snapshots/mirrors, not an ordered bootstrap script. Compare schema/migration history before provisioning or changing databases. Preserve existing booking IDs. Follow CLAUDE.md for migration ownership.

Amoy is testnet. The registry registrar is tied to the configured wallet; do not replace its key or redeploy during ordinary app setup. Never commit .chain-local signed transaction state. Staff manually verify actual funds; blockchain cannot authenticate a screenshot. No customer crypto wallet or crypto payment is required. Proof reconciliation currently depends on staff activity/polling; no unattended worker exists. See BLOCKCHAIN.md.

## Collaboration

Review this draft handoff before merging into dev; email setup and hosted acceptance remain unfinished. Source publication is not website deployment.

```sh
git fetch origin
git switch dev
git pull --ff-only origin dev
git switch -c feature/your-task
```

Agree task ownership before changing shared auth/database settings. Push focused feature branches and open PRs into dev; describe changes, verification and limitations. Review together. Merge dev into protected main after launch gates pass; never force-push shared branches.

Do not commit .env.local, private keys, receipts, database exports, node_modules, .next, runtime files or archives. .env.example contains names only. README and this handoff summarize current status; older dated notes are historical where superseded.
