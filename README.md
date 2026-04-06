# ConnectGHIN

Monorepo for ConnectGHIN — a full-stack golf social product with discovery, matching (GHINder), messaging, memberships, and an admin console.

| App | Stack | Path |
|-----|--------|------|
| API | NestJS, Prisma, PostgreSQL, Redis, Stripe, Socket.IO | `apps/api` |
| Admin | Next.js (App Router), Tailwind | `apps/admin` |
| Mobile | Flutter (Riverpod, GoRouter, Dio) | `apps/mobile-flutter` |

High-level design and rationale: see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Requirements

- **Node.js** ≥ 20
- **npm** (workspaces)
- **PostgreSQL** & **Redis** (or use Docker Compose)
- **Flutter** SDK (for mobile only)

## Quick start with Docker

From the repo root:

```bash
npm install
docker compose up -d
```

This starts PostgreSQL, Redis, and the API (migrations run on container start). Default API base: `http://localhost:3000/api/v1`.

## Local development (without Docker API container)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Infrastructure**

   Start PostgreSQL and Redis (or `docker compose up -d postgres redis` and run the API on the host).

3. **Environment**

   Copy the root `.env.example` into `apps/api/.env` and adjust values. For the admin UI, copy `apps/admin/.env.example` to `apps/admin/.env.local` (or set `NEXT_PUBLIC_API_URL`).

4. **Database**

   ```bash
   npm run api:prisma:generate
   npm run api:prisma:migrate
   ```

   Optional seed:

   ```bash
   npm run api:prisma:seed
   ```

5. **Run the API**

   ```bash
   npm run api:dev
   ```

6. **Run the admin dashboard**

   ```bash
   npm run admin:dev
   ```

   Admin defaults to port **3001** (`http://localhost:3001`).

## Flutter mobile app

```bash
cd apps/mobile-flutter
flutter pub get
```

Run with your API URL (Android emulator often uses `10.0.2.2`; debug builds default to that if you omit the define):

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
```

**Release / production:** `API_BASE_URL` is required (no emulator default). Use HTTPS for the live API, for example:

```bash
flutter build apk --dart-define=API_BASE_URL=https://api.yourdomain.com/api/v1
```

Push notifications require Firebase configuration for your platform (`google-services.json` / `GoogleService-Info.plist` and `flutterfire` / `Firebase.initializeApp` setup as per Firebase docs).

## NPM scripts (root)

| Script | Description |
|--------|-------------|
| `npm run api:dev` | API in watch mode |
| `npm run api:build` | Build API |
| `npm run api:prisma:generate` | Generate Prisma client |
| `npm run api:prisma:migrate` | Run Prisma migrations (dev) |
| `npm run api:prisma:seed` | Seed database |
| `npm run admin:dev` | Next.js admin dev server |
| `npm run admin:build` | Production build for admin |
| `npm run docker:up` / `docker:down` | Start/stop Compose stack |

## API tests

```bash
cd apps/api
npm test
npm run test:e2e
```

## Environment variables

See [.env.example](./.env.example) for DATABASE_URL, JWT secrets, Stripe, S3, Redis, CORS, and Firebase-related placeholders. **Use strong JWT secrets in production** and rotate Stripe webhook secrets per environment.

## License

Private / unpublished — adjust as needed for your organization.
