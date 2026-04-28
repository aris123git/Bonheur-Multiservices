# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## WhatsApp Bot (Twilio + Claude)

Built into `@workspace/api-server`. The Twilio integration in Replit was dismissed by the user; credentials are stored as plain secrets (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`) and consumed directly via `process.env`.

**Conversational AI:** Anthropic Claude (`claude-sonnet-4-6`) via the Replit AI Integrations proxy. The bot always replies in French regardless of input language. Per-user conversation history is persisted to PostgreSQL.

**Routes:**
- `POST /api/whatsapp/webhook` — Twilio inbound message webhook. Validates `X-Twilio-Signature` (skipped when `NODE_ENV=development`), routes to Claude, and replies with TwiML.
- `POST /api/whatsapp/send` — JSON `{ to, body }`; sends an outbound WhatsApp message via Twilio REST API.
- `GET /api/whatsapp/status` — reports whether all three Twilio secrets are present.
- `GET /api/whatsapp/history/:phoneNumber` — returns the stored conversation for a phone number (use the raw number, e.g. `+15551234567`).
- `DELETE /api/whatsapp/history/:phoneNumber` — clears the stored conversation.

**Bot logic:** `src/lib/claudeBot.ts`. The user can type `reset` / `réinitialiser` / `recommencer` (or `/reset`, `/clear`) in WhatsApp to wipe their history.

**Database:** `whatsapp_conversations` (one row per phone number) and `whatsapp_messages` (role + content + timestamp), defined in `lib/db/src/schema/`. Run `pnpm --filter @workspace/db run push` after schema changes.

**Anthropic integration:** `lib/integrations-anthropic-ai/` exposes a pre-configured Anthropic SDK client. Env vars `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` and `AI_INTEGRATIONS_ANTHROPIC_API_KEY` are auto-managed by Replit.

**Twilio setup:** In the Twilio Console, set the WhatsApp sandbox / number's "When a message comes in" webhook to `https://<your-replit-domain>/api/whatsapp/webhook` (HTTP POST).
