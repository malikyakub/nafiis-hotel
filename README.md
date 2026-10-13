# Nafiis Hotel

Blockchain Enabled Hotel Management System for a single hotel in Mogadishu. SNU Batch Four CS thesis, 2026.

A hotel management system with guest booking, staff management and booking proofs on Polygon Amoy testnet. Guests transfer through EVC Plus/eDahab and upload a receipt; staff verify funds before approving. Blockchain records approved booking proofs only; it does not verify screenshot authenticity or perform mobile-money transfers.

## Current status — 9 October 2026

- 30 demo rooms: 10 Garden, 8 Ocean, 12 Family suites; Room 001–030.
- Account-optional booking, first-receipt-wins room reservation with 24-hour unpaid expiry, private receipt uploads, customer history, room/food management and staff portals.
- A labelled demo passed booking, receipt review, real Amoy proof confirmation, check-in and checkout. No real payment was made.
- **Everyone logs in with email + password.** Email codes apply only when guests create accounts. Signup SMTP/code templates remain unconfigured and deferred; existing confirmed accounts can use password login. See [email verification](docs/EMAIL-VERIFICATION.md).
- Updated application is not hosted online. This source handoff is separate from website deployment.

## Run locally

Install Node.js 22 and npm, then run `npm ci`. Copy `.env.example` to `.env.local` and obtain configuration privately from the project owner. Never commit credentials.

```sh
npm run dev -- --hostname 127.0.0.1 --port 4176
```

Open http://127.0.0.1:4176 and keep the terminal running. Windows users can also run `./start-local.ps1` from this folder after installing dependencies.

Routes: `/` booking, `/booking/[id]` private payment page, `/guest` customer history, `/admin` administrator, `/reception` receptionist. Registration never grants staff access.

## Verification and collaboration

```sh
npm run check:local
npm run typecheck
npm run build
npm run deployment:check
```

The local suite uses dependency doubles and sends no email or chain transactions. Deployment preflight performs read-only chain checks using environment configuration. See [acceptance results](docs/ACCEPTANCE-RESULTS.md) and [partner handoff](docs/PARTNER-HANDOFF.md) for completed checks, remaining tasks and shared database cautions.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Supabase Postgres/Auth/private Storage, Solidity and server-only ethers.js. Netlify configuration is included; static ZIP hosting cannot run the backend.

## Branches

- `main`: protected, always deployable, merges only through pull request
- `dev`: integration branch
- `feature/<module>`: one branch per task, PR into `dev`

Commit messages: `type: what changed` (feat, fix, db, contract, docs).
