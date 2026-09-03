# Reference-only archive

The supported production contractor pipeline is TypeScript: `src/lib/contractor-discovery.ts`, `contractor-outreach.ts`, and `vapi-outbound.ts`, backed by the shared Supabase CRM. Research uses Hermes or manual entry, and outbound calls require individual human approval and the existing consent gates.

`conquistador-oil-agent/` preserves the old Python experiment for historical reference. It is excluded from Vercel uploads. Do not install it, schedule it, give it credentials, or use its instructions to configure the current app.

This source move does not stop an already deployed copy. Before merging or deploying, the owner must inventory external scheduled workers and confirm none still uses the old repository path. Do not shut down unrelated infrastructure without approval. If a worker remains active, migrate its required functionality deliberately before retirement.

Old build PDFs, bot instructions, and the disabled hardcoded push shortcut live in `docs/legacy/`. These are not current runbooks or contractor policy. Windows development launchers remain in the root. Original brand PNGs are retained in `brand-originals/`; `node scripts/optimize-brand.mjs` regenerates the smaller public assets. No history was rewritten; archived material is recoverable from this directory and Git history. Moving originals does not reduce historical Git repository size.
