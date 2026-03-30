ConnectGHIN API Overview (Client Version)

This document explains how the ConnectGHIN backend and database work, in business-friendly terms.

What the API does

The API is the central service that powers:

- account creation and login
- golfer profiles and photos
- discovery and GHINder swiping
- match creation
- chat and messaging
- memberships/subscriptions
- safety/reporting tools
- admin moderation workflows

In short: the API receives requests from the mobile app/admin dashboard, applies business rules, reads/writes database records, and returns safe JSON responses.

High-level architecture

- Backend framework: NestJS (TypeScript)
- Primary database: PostgreSQL (relational)
- ORM/data layer: Prisma
- Realtime chat: Socket.IO
- Rate-limit/cache support: Redis
- Billing: Stripe (checkout, portal, webhooks)
- Media storage: Local uploads or S3-compatible storage

The API is modular by domain (Auth, Profiles, Discovery, Swipes, Matches, Messaging, Subscriptions, Notifications, Safety, Admin).

Request flow (how a typical API call works)

1. Mobile/admin sends request to a versioned endpoint (`/api/v1/...`).
2. API validates payloads and authentication.
3. Domain service applies business logic.
4. Service reads/writes PostgreSQL via Prisma.
5. API returns response (or a clear validation/business error).
6. For relevant events, additional actions are triggered (push notification, websocket event, Stripe sync, etc.).

Backend modules and business behavior

Auth

- Register, login, refresh token, current user (`me`), forgot/reset password.
- Passwords are hashed; JWT access/refresh model is used.

Profiles

- Stores profile details (display name, bio, city, handicap, preferences).
- Tracks profile completion percentage.
- Supports photo upload metadata and primary photo handling.
- Includes GHIN verification flags for trust/quality filtering.

Discovery / GHINder / Matches

- Discovery returns filtered candidate golfers.
- Swipe rules prevent duplicates and self-swipes.
- Reciprocal likes create a match automatically.

Messaging

- Conversation creation follows permission rules (match-based + premium options).
- Messages support read state and notifications.
- Realtime chat events are pushed via websocket namespace `/chat`.

Subscriptions

- Stripe checkout session creation for premium.
- Customer portal links for billing management.
- Webhook processing keeps internal membership state in sync with Stripe events.

Notifications & Safety

- Device token registration for push delivery.
- Notification listing/read state.
- Reporting/blocking and moderation support.

Admin

- Dashboard stats, user management, GHIN verification queue, reports, subscriptions, audit logs, and app settings.

Database design (PostgreSQL)

The database is relational and normalized around key entities:

- `User` + `Profile`
- `ProfilePhoto`
- `Swipe` + `Match`
- `Conversation` + `Message` + participants
- `Subscription` + `PaymentEvent`
- `Notification` + `DeviceToken`
- `Report` + `Block`
- `AdminAuditLog`
- `AppSettings`

Why this design works

- Data integrity: foreign keys + unique constraints avoid invalid/duplicate states.
- Scalability: indexes are added for high-frequency lookups (messages, swipes, reports, subscriptions).
- Traceability: payment events and admin audit logs preserve historical actions.
- Extensibility: domain tables are separated, making new features safer to add.

Security and reliability

- DTO validation for request safety.
- JWT auth guard and role-based admin routes.
- Rate limiting (Redis-backed where available).
- CORS and secure headers.
- Global error handling with consistent API responses.

Deployment model

- Docker Compose is available for local/staging setup (Postgres, Redis, API).
- Environment variables drive secrets and provider config (JWT, Stripe, S3, Firebase, CORS).
- DB migrations are versioned and applied via Prisma.

Integrations and side effects

- Stripe: source of truth for billing lifecycle; webhooks update membership status.
- Push notifications: API stores device tokens and sends alerts for match/message events.
- Socket.IO: delivers realtime chat messages to connected users.

API versioning and client impact

- The API uses a versioned prefix (`/api/v1`), allowing non-breaking evolution.
- New fields/endpoints can be added while keeping existing client behavior stable.

Non-technical summary

ConnectGHIN’s backend is designed to be:

- Reliable (clear rules + consistent data)
- Secure (auth, validation, throttling)
- Scalable (modular services + indexed relational DB)
- Product-ready (subscriptions, realtime chat, moderation, push notifications)
