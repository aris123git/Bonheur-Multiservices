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

## WhatsApp Bot (Twilio)

Built into `@workspace/api-server`. The Twilio integration in Replit was dismissed by the user; credentials are stored as plain secrets (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`) and consumed directly via `process.env`.

**Routes:**
- `POST /api/whatsapp/webhook` — Twilio inbound message webhook. Validates `X-Twilio-Signature` (skipped when `NODE_ENV=development`) and replies with TwiML.
- `POST /api/whatsapp/send` — JSON `{ to, body }`; sends an outbound WhatsApp message via Twilio REST API.
- `GET /api/whatsapp/status` — reports whether all three Twilio secrets are present.

**Bot logic:** `src/lib/botReply.ts` (commands: `help`, `ping`, `time`, `joke`, `about`, `echo <text>`).

**Twilio setup:** In the Twilio Console, set the WhatsApp sandbox / number's "When a message comes in" webhook to `https://<your-replit-domain>/api/whatsapp/webhook` (HTTP POST).
