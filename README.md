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

**If `10.0.2.2` times out** (API works in a desktop browser but not from the emulator): allow **TCP 3000** through Windows Firewall, ensure the API listens on **`0.0.0.0`**, try your PC’s **LAN IPv4** in `API_BASE_URL`, or use **ADB reverse** so the emulator’s `127.0.0.1:3000` maps to the host:

```bash
adb -s emulator-5556 reverse tcp:3000 tcp:3000
flutter run -d emulator-5556 --dart-define=API_BASE_URL=http://127.0.0.1:3000/api/v1
```

(Replace `emulator-5556` with `adb devices` id.) **Windows one-liner** from `apps/mobile-flutter`: run `tool\run_android_with_adb_reverse.cmd` (optional first arg = device id). That runs `adb reverse` then `flutter run` with `127.0.0.1:3000/api/v1`. Re-run reverse after restarting the emulator. Many LDPlayer setups work fine with the default `10.0.2.2` when the host path and firewall are correct.

The Android app includes `res/xml/network_security_config.xml` so **cleartext HTTP** to `10.0.2.2` / `127.0.0.1` is explicitly allowed (see [Android emulator networking](https://developer.android.com/studio/run/emulator-networking) and [this local-dev walkthrough](https://medium.com/livefront/how-to-connect-your-android-emulator-to-a-local-web-service-47c380bff350)). A **timeout** usually means the TCP connection never reached the host (firewall, wrong IP, or API not listening on `0.0.0.0`), not cleartext policy—cleartext blocks often surface as immediate `CLEARTEXT not permitted` errors instead.

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
