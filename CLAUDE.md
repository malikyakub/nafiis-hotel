@AGENTS.md

# Nafiis project rules

Source of truth is Notion (Project Overview, Development Workflow, Backend Architecture, Dev Tasks). If code and Notion disagree, flag it to M.K.

- No blockchain calls from the browser. ethers.js is used only in server code (`lib/chain`, route handlers).
- No secrets in the repo, client code or `NEXT_PUBLIC_` variables. Only `.env.example` (names only) is committed.
- A chain write happens only after a server-side admin role check (`requireRole('admin')`).
- `supabase/migrations` is owned by the DB agent. The Dev agent does not write schema SQL.
- Route protection lives in `proxy.ts` (Next.js 16 name for middleware).
- Git: `main` protected, `dev` integration, `feature/<module>` per task, PR into `dev`. Commits: `type: what changed` (feat, fix, db, contract, docs).
- Branding is placeholder: name in `lib/brand.ts`, colours in `app/globals.css`.
