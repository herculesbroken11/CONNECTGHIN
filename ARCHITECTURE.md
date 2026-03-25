# ConnectGHIN Architecture

## Monorepo layout

- `apps/api` - NestJS backend (TypeScript, Prisma, PostgreSQL, Redis, Stripe, Socket.IO)
- `apps/admin` - Next.js admin dashboard (App Router, client pages with token auth)
- `apps/mobile-flutter` - Flutter mobile app (Riverpod, GoRouter, Dio, Socket.IO, Firebase Messaging)
- `docker-compose.yml` - Local orchestration for PostgreSQL, Redis, and API

## Major technology decisions and rationale

### Backend: NestJS + Prisma + PostgreSQL

- **NestJS modules by domain** (`auth`, `profiles`, `swipes`, `messaging`, etc.) keep business logic isolated and testable.
- **Prisma** gives strongly typed DB access and migration flow, reducing query drift as product features grow.
- **PostgreSQL** handles relational integrity needed for users, swipes, matches, subscriptions, and admin/audit entities.
- **Redis-backed throttling** protects public/auth endpoints with shared limits across multiple API instances.

### Realtime + async communication

- **Socket.IO chat gateway** handles low-latency message fanout for conversations.
- **Push notifications pipeline** (device token registration + server push module) covers offline delivery for matches/messages.
- **Event-driven server emission** (`chat.message`) separates message persistence from websocket fanout.

### Auth and security

- **Access + refresh JWT model** supports short-lived access tokens with seamless refresh.
- **Global validation and guards** enforce DTO validation and auth consistently.
- **Rate-limiting + helmet + CORS controls** provide baseline API hardening.

### Payments and membership

- **Stripe Checkout + Portal + Webhooks** keeps billing logic externalized while syncing entitlement state internally.
- **Membership fields on user + subscription ledger** separates current access state from historical billing events.

### Mobile architecture

- **Riverpod providers** centralize dependencies and state.
- **Typed repository models** reduce runtime map-casting bugs.
- **Dio interceptors with refresh handling** keep authenticated API calls resilient.
- **Onboarding gate** (profile completion threshold) ensures users enter core matching flows with minimum profile quality.

### Admin architecture

- **Dedicated Next.js admin app** isolates moderation/ops from user-facing clients.
- **Route-level pages per operational function** (`users`, `reports`, `ghin-queue`, `audit`, `subscriptions`) map cleanly to admin workflows.

## Scalability notes

- API can be horizontally scaled behind a load balancer because auth is stateless JWT and throttling uses Redis.
- Socket auth uses JWT in handshake, allowing multi-instance realtime deployments.
- Prisma schema includes targeted indexes for high-frequency paths (swipes, messages, reports, subscriptions).
- Push/device and subscription event records support asynchronous workflows and retries without data loss.
