# Nafiis Hotel

A responsive hotel website and interactive hotel-management prototype based on the Nafiis reference design and the supplied Blockchain-Enabled Hotel Management System specification.

## Run locally

With Node.js installed, run `node server.js` from this folder and open `http://127.0.0.1:4173`.

## Included flows

- Public hotel home page, room cards, restaurant preview, amenities, contact details, and quick booking.
- Guest booking and manual payment-proof submission.
- Guest workspace with bookings, restaurant orders, payment status, and proof history.
- Admin payment-review queue. Approving a payment confirms the booking and adds a demo transaction record; rejecting it does not create a record.
- Reception/front-desk and restaurant staff workspace views.

This is a browser-only prototype. It saves demo booking state in local storage. It does not currently connect to Supabase, upload payment images to secure storage, authenticate staff, or send a real transaction to Polygon. The hash, wallet, and block details shown after approval are simulated. Those integrations are needed before using it with real guests or payments.
