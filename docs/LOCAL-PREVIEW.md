# Local preview

Open this Next.js folder in VS Code. Install Node.js 22, run npm ci, and copy .env.example to .env.local with settings supplied privately by the project owner.

Run ./start-local.ps1 in PowerShell, or npm run dev -- --hostname 127.0.0.1 --port 4176. Keep the terminal running. Open http://127.0.0.1:4176.

## Current limitations

Login now uses an email code. SMTP and email templates are not configured; the owner deferred setup. See EMAIL-VERIFICATION.md. Existing passwords/accounts remain, but the login screen uses codes. Do not treat login as operational before email setup.

The shared database has 30 demo rooms and the Amoy demo flow passed through checkout. A new checkout still needs private environment configuration. Do not reset the shared database or redeploy the contract merely to run the app.

## Routes

- / : public site and account-optional booking.
- /booking/[id] : payment instructions and private receipt upload, tied to the booking browser.
- /guest : verified customer booking history.
- /admin and /reception : existing staff roles only; registration never creates staff.

Use explicitly labelled demo receipts for acceptance checks. Staff must verify actual funds for genuine payments. Blockchain records booking proof and does not validate the screenshot.

Read README.md, PARTNER-HANDOFF.md and ACCEPTANCE-RESULTS.md for current setup, completed checks and remaining launch gates. Source publication is separate from hosting; the updated app is not yet deployed online.
