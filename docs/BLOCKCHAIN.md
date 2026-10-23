# Booking proofs on Polygon Amoy

## Latest deployment status

Amoy contract deployed and verified on 2026-10-08: `0x1AedE4EB72E3798F1Ed6fDa8752658E4eCA1E9A9`. Deployment transaction: https://amoy.polygonscan.com/tx/0x1343cbbea63bd37bcb1ed70013259bf44a8d2590d92e830cf0fff91bb4744fd9. Script verified successful receipt, at least three confirmations, canonical block, deployed code and matching registrar. This address and the deployment steps below are historical setup records.

The demo booking proof flow was exercised on Amoy on 2026-10-08. The retained demo booking was checked in and then checked out by the owner; read-only verification on 2026-10-09 confirmed `checked_out`, approved payment, and confirmed proof. The receipt was a demo fixture and no real EVC/eDahab transfer occurred. Do not count the demo booking as revenue. This did not verify a real mobile-money transfer, production hosting configuration, or live customer/receptionist acceptance. Do not repeat the demo transaction as part of code review.

Earlier setup notes below are historical where they say funding or deployment is missing. Host environment configuration is still required separately.


Implemented for booking confirmation only. Guests pay using the hotel's ordinary
payment instructions and upload a screenshot/receipt. An active administrator
reviews it (receptionists see status only). Approval saves `under_review`, then the server signs a
booking attestation. Three confirmations, a matching contract event and matching
contract storage are required before the database marks the booking `confirmed`.
This proves the hotel recorded its approval; it does not independently prove a
bank transfer was genuine. Staff must check their payment account themselves.

## Local setup

Historical setup note (2026-10-08): a dedicated Amoy test wallet was generated locally. Its private key belongs only in ignored `.env.local`; the public address was `0x67f13E9D8308ef33E7Bc9990Fd1F577e0D701485`. The wallet was subsequently funded with test POL for deployment. Never send real funds to this demo wallet.

`npm run chain:setup` (or `node contracts/scripts/setup-amoy.mjs`) prepares missing local wallet/RPC values without replacing an existing key, and reports only the public address and balance. It refuses to create a replacement wallet if a deployment record/address already exists. Keep a secure local backup of the private key; it is excluded from source archives. Once funded, run `./deploy-blockchain.ps1` and save its confirmed registry address locally.

Open this original Next.js project in VS Code. In its ignored `.env.local`, enter:

```dotenv
SUPABASE_SECRET_KEY=<Supabase server secret key>
AMOY_RPC_URL=<trusted Polygon Amoy RPC URL>
SYSTEM_WALLET_PRIVATE_KEY=<dedicated Amoy test wallet private key>
PROOF_REGISTRY_ADDRESS=
```

Keep the existing public Supabase variables. Do not paste private keys into chat,
commit them, or prefix them with `NEXT_PUBLIC_`. The public anon/publishable key
cannot replace `SUPABASE_SECRET_KEY`.

1. Create a separate test wallet using your wallet application and fund its public
   address with **test POL** from https://faucet.polygon.technology. Do not use a
   wallet holding real assets. No customer wallet is needed.
2. Enter the private key locally. Use chain **80002** only. Official endpoints:
   https://docs.polygon.technology/pos/reference/rpc-endpoints/.
3. Install dependencies with `npm ci`, then run `npm run chain:deploy` from
   this directory. On this Windows computer, `./deploy-blockchain.ps1` also finds
   the existing Node runtime when Node is missing from PATH.
   Alternatively, if npm is unavailable but Node is installed:
   `node --env-file=.env.local contracts/scripts/deploy.mjs`.
4. The command compiles the contract and saves the signed deployment to the ignored
   `.chain-local/amoy-deployment.json` **before** sending it. If it reports pending,
   rerun the same command shortly. It reuses the saved transaction and prints the
   public address after three confirmations. Put that address in
   `PROOF_REGISTRY_ADDRESS`. Keep the deployment record, including after success;
   it prevents accidental duplicate deployment. If a shutdown leaves
   `.chain-local/deploy.lock`, close any deployment processes before deleting
   only that lock file. Do not delete the JSON record or change the contract source
   or wallet while deployment is pending.
5. Restart `start-local.ps1`. Admin and reception have a Payments tab. Approve a
   receipt, then use **Check blockchain proof**. Pending proof transactions are
   checked every 15 seconds while that staff list is open. Customer and staff
   booking cards link to the real transaction on the Amoy explorer.

The dedicated wallet pays testnet gas. Keep it exclusive to this application's
proofs after deployment. Do not manually reuse its nonce or send other
transactions while proofs are pending. Do not change the wallet/contract settings
with outstanding jobs. The contract's registrar is immutable; wallet rotation
requires an intentional new deployment and a migration plan.

## Reliability and privacy

- Only server-side ethers code signs transactions. A fresh database-backed staff
  role check precedes every operation. Receptionist authorization was explicitly
  requested by the owner on 2026-10-07.
- A service-only database lease and unique pending-job constraint serialize the
  wallet. Signed bytes are durably saved **before** broadcasting. A lost response
  or restart reuses those exact bytes and transaction hash.
- Approval survives an RPC failure. No fake transaction hashes or simulated
  confirmations are generated. A missing configuration leaves the booking under
  review. `Check blockchain proof` can resume processing.
- On-chain data is only a random booking key and SHA-256 commitment. The canonical
  snapshot includes a random salt, booking details, payment review identity/time
  and receipt digest. It stays in a service-only table. Payment attachments remain
  in private Storage. Booking proof reads follow booking ownership/staff RLS.
- Paid booking dates, room, price and guest count cannot be edited. Confirmation
  requires a proof row written by the trusted server after receipt verification.
- A reverted transaction is displayed as failed and does not confirm a booking.
  Diagnose it before an operator creates any replacement; automatic fee bumping
  and replacement transactions are not implemented. A stuck pending transaction
  intentionally stops later transactions from this wallet.
- Reconciliation runs on staff actions and while a staff portal with pending
  transactions is open. There is no unattended scheduled worker yet. Reopen the
  portal after shutdown to resume. Three confirmations are a demo policy, not a
  guarantee against arbitrarily deep chain reorganizations.

## Delivery status

Contract source, deployment command, backend, portals and the Supabase schema
are implemented. The Amoy deployment and the demo booking proof/checkout were
verified as described above. This confirms only the demo path and test network;
it does not prove receipt authenticity or production readiness. Hosted
environment settings must be configured separately. Automated tests were not
run during the 2026-10-11 blockchain review.

Migration record: `booking_only_amoy_proofs`, mirrored in
`docs/booking-blockchain.sql`. Do not rerun it on the existing project.
