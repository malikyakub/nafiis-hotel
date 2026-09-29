# Nafiis

Blockchain Enabled Hotel Management System for a single hotel in Mogadishu. SNU Batch Four CS thesis, 2026.

A full hotel management system (rooms, bookings, staff, restaurant, admin) where approved payments and verified ID documents are anchored on Polygon Amoy as salted hashes, making them tamper-evident. All real data stays in Supabase.

## Stack

Next.js (App Router) + Tailwind CSS, Supabase (Postgres, Auth, Storage), Solidity + Hardhat, Polygon Amoy, ethers.js (server only), Vercel.

## Branches

- `main`: protected, always deployable, merges only through pull request
- `dev`: integration branch
- `feature/<module>`: one branch per task, PR into `dev`

Commit messages: `type: what changed` (feat, fix, db, contract, docs).
