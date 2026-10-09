# Local preview

In VS Code, open this Next.js project folder and run `./start-local.ps1` in its PowerShell terminal. The launcher finds Node.js on PATH or uses the existing Codex Node.js runtime on this computer. It starts http://127.0.0.1:4176. Keep the terminal open and press Ctrl+C to stop. Run only one development server for this project at a time.

Port 4174 serves the older, different frontend. Use the URL printed by this launch script for the original Next.js project and its new portals.

Public Supabase configuration is in the ignored .env.local file. Put SUPABASE_SECRET_KEY in that file locally, never in chat or GitHub. Next.js reloads after environment changes. Use the real project secret key from Supabase API settings, not the public anon/publishable key.

## Try the application

1. Browse the original home, rooms, dining, about and contact pages.
2. Sign in at /login as the administrator zizoubariise@gmail.com, using the password chosen when registering that account. You should reach /admin, with Bookings and Payments sections. The prior administrator now has guest access; passwords were not changed by the transfer.
3. Sign out and register a separate customer account. Complete email verification, then sign in. Customer history is at /guest. Configure the local /auth/callback URL in Supabase Auth redirect URLs if necessary.
4. Once the server key is configured, submit a booking from the original homepage using the demo inventory. Sign in with the verified booking email to see it under My bookings.
5. Upload a real payment receipt for a pending booking. An administrator can download it and approve or reject the payment with a note.
6. Approved payments remain under review until the real blockchain integration is configured. They are not confirmed automatically. Reception can check in confirmed reservations and check out checked-in guests.

## Pending before full end-to-end testing

- Demo inventory is configured: 30 rooms: Room 001–010 Garden ($75/night, 2 guests), Room 011–018 Ocean ($95/night, 2 guests), Room 019–030 Family suite ($160/night, 5 guests). These are sample rooms authorized by the owner on 2026-10-07, not real hotel inventory.
- Server-only Supabase key in .env.local.
- Three receptionist email addresses and assigned roles.
- Deployed Polygon Amoy proof contract, RPC and system wallet configuration; blockchain writes are implemented but not activated until these settings are supplied.

The local preview is not an online deployment. GitHub synchronization is deferred at the owner's request until access is granted. Do not upload .env.local, node_modules, .next, local runtime files or deployment archives.

See DEPLOYMENT-READINESS.md for current hold rules, hosting setup and remaining acceptance checks.
