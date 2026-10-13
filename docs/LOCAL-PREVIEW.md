# Local preview

Open this Next.js folder in VS Code. Install Node.js 22, run npm ci, and copy .env.example to .env.local with settings supplied privately by the project owner.

Run ./start-local.ps1 in PowerShell, or npm run dev -- --hostname 127.0.0.1 --port 4176. Keep the terminal running. Open http://127.0.0.1:4176.

## Current limitations

Login uses registered email and password. No login code is sent or entered. Guest registration verification and password recovery still use their existing email flows; signup SMTP/template setup remains deferred. See EMAIL-VERIFICATION.md. The Friday preview on port 4176 received the same login correction on 2026-10-13.

The shared database has 30 demo rooms and the Amoy demo flow passed through checkout. A new checkout still needs private environment configuration. Do not reset the shared database or redeploy the contract merely to run the app.

## Routes

- / : public site and account-optional booking.
- /booking/[id] : payment instructions and private receipt upload, tied to the booking browser.
- /guest : verified customer booking history.
- /admin and /reception : existing staff roles only; registration never creates staff.

Use explicitly labelled demo receipts for acceptance checks. Staff must verify actual funds for genuine payments. Blockchain records booking proof and does not validate the screenshot.

Read README.md, PARTNER-HANDOFF.md and ACCEPTANCE-RESULTS.md for current setup, completed checks and remaining launch gates. Source publication is separate from hosting; the updated app is not yet deployed online.
