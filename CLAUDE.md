@AGENTS.md

# Nafiis project rules

Source of truth is Notion (Project Overview, Development Workflow, Backend Architecture, Dev Tasks). If code and Notion disagree, flag it to M.K.

- No blockchain calls from the browser. ethers.js is used only in server code (`lib/chain`, route handlers).
- No secrets in the repo, client code or `NEXT_PUBLIC_` variables. Only `.env.example` (names only) is committed.
- A chain write happens only after a server-side admin role check (`requireRole('admin')`).
- `supabase/migrations` is owned by the DB agent. The Dev agent does not write schema SQL.
- Route protection lives in `proxy.ts` (Next.js 16 name for middleware).
- Git: `main` protected, `dev` integration, `feature/<module>` per task, PR into `dev`. Commits: `type: what changed` (feat, fix, db, contract, docs).
- Strict: never add `Co-Authored-By` trailers or any Claude/AI attribution to commits or PR descriptions.
- UI: build pages only from `components/ui/` (showcase at `/components`). Inputs, buttons and badges are fully rounded; inputs take a lucide icon prefix. Icons come from `lucide-react`. Light mode only, no `dark:` classes.
- Server logging goes through `logError` in `lib/log.ts`. No `console.log`, and never log whole error objects, keys or tokens.
- Branding is placeholder: name in `lib/brand.ts`, colours in `app/globals.css`.
