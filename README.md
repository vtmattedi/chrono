# Chrono

**Multiple timers, one place.** Chrono runs countdown timers for several teams at once. You can run
it locally in your browser, or host a live session and share a link so everyone sees the same clocks in
real time. It was built for competitions and workshops where many teams share one stopwatch.

Version **1.2**

> **History.** On **2026-10-21** this repository unified two separate projects into one monorepo:
>
> | Was | Now | Source repository | Active | Last commit |
> | --- | --- | --- | --- | --- |
> | `ChronoApp` (frontend) | `apps/web` | `github.com/vtmattedi/ChronoApp` | 2025-09-21 to 2025-10-09, 43 commits | `f4b429f` |
> | `chronows` (server) | `apps/server` | `github.com/vtmattedi/chronows` | 2025-09-24 to 2025-10-09, 31 commits | `b6a1de7` |
>
> Both histories are preserved in this repository, with every file path moved under `apps/web` or
> `apps/server` (so `git log -- apps/web` and `git blame` follow the original commits). Commit hashes
> therefore differ from the old repositories, whose last commits are listed above. The old repositories
> are archived; this one, <https://github.com/vtmattedi/chrono>, is where development continues.

## Features

- **Local run**: start timers in the browser with no account or server (works offline).
- **Shared sessions**: create a session, share its link, and watch the clocks live. Up to 20 teams per session.
- **Per-team control**: start, pause, finish, reset, add or remove time, and run a team at 0.5x, 1x, 2x or 4x.
- **Roles**: the owner can promote viewers to admins, or make the session open so everyone can control it.
- **CSV**: load teams and base time from a CSV, export results, and verify an exported file's checksum.
- **Session log**: every action is recorded; the log can be public or limited to admins.
- **Settings**: alias, light/dark theme, and switches for action and token notifications.
- **Admin page** (`/admin`): list users and sessions, take ownership of a session. Needs the admin name and password.

## Repository layout

```
chrono/
  apps/
    web/       React 19, Vite, TypeScript, Tailwind 4, shadcn/ui, socket.io-client
    server/    Express 4 + Socket.IO, run with tsx (in-memory state, no database)
  docker-compose.stackport.yml
  .env.example
```

Each app keeps its own `package.json` and lockfile (no npm workspaces); the root `package.json` only
holds convenience scripts.

## How it works

```
 browser ──HTTPS──▶ nginx (apps/web container)
                      ├─ /            static React build (falls back to index.html for client routes)
                      ├─ /api/*       ──▶ server :4500   REST (tokens, sessions, roles, logs, admin)
                      └─ /socket.io/  ──▶ server :4500   Socket.IO (live ticks and actions)
```

- **Identity.** There are no accounts. `POST /api/token` issues an encrypted token (JWE, A256GCM; issuer
  `chronows`, audience `cronoapp`) holding a user id, alias and role. The browser keeps it in `localStorage`.
- **Sessions.** The server owns the clocks. Each session ticks every ~250 ms and corrects drift. It sends
  partial `tick` updates, with a `fulltick` every 15th tick, to everyone in the Socket.IO room.
- **Actions.** Authorised clients send `start`, `pause`, `finish`, `rearm`, `add:<seconds>` or `speed:<x>`
  over the socket. The server applies them and relays them to the other clients.
- **State** lives in memory. Restarting the server ends all sessions and forgets all users.

### REST API

| Route | Auth | Purpose |
| --- | --- | --- |
| `POST /api/token`, `POST /api/validatetoken` | none / token | Get, rename or validate a token |
| `POST /api/newsession`, `/killsession`, `/setowner`, `/updateroles` | token | Manage sessions and roles |
| `GET /api/mysessions`, `GET /api/sessionlog/:id` | token | List your sessions, read a log |
| `POST /api/requestadmin` | token + admin credentials | Upgrade the caller to admin (a `GET` form also exists) |
| `GET /api/listusers`, `/listsessions` | admin | Admin page data |
| `GET /api/healthy` | none | Health check |

Socket messages are JSON strings on the `message` event: `identify`, `join`, `action`, `echo`.

## Getting started

Needs Node.js 22 or newer.

```
npm run install:all
cp apps/server/.example.env apps/server/.env      # then set the values (see below)
npm run dev                                       # server + web together
```

`npm run dev` starts the server on <http://localhost:4500> and the web app on <http://localhost:5173>.
Other scripts: `dev:server`, `dev:web`, `build:web`, `lint:web`.

In development the web app talks to `localhost:4500`; in production it talks to whatever origin served it.

### Configuration (server)

| Variable | Required | Notes |
| --- | --- | --- |
| `JWT_ENC_KEY` | yes | 64 hex characters (32 bytes). `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_SECRET` | yes | Legacy startup check; any non-empty value |
| `ADMIN_NAME`, `ADMIN_PASSWD` | for `/admin` | Credentials for upgrading a user to admin; use a strong password |
| `PORT` | no | Default 4500 |
| `AFK_CHECK_MINS` | no | Minutes before an empty, idle session is removed (default 2880) |
| `SERVER_ONLY`, `FRONTEND_FOLDER` | no | Serve the built frontend from the server (dev/legacy; see below) |

## Deploying (Stackport)

`docker-compose.stackport.yml` runs two services and publishes no host ports:

- `chrono-web` (`apps/web/Dockerfile`): nginx serving the built frontend and proxying `/api/` and `/socket.io/`
  (with WebSocket upgrade) to `chrono-api`. Config: `apps/web/nginx.conf`.
- `chrono-api` (`apps/server/Dockerfile`): the server on port 4500, reachable only by `chrono-web`.

Stackport settings:

- Domain `chrono.mattediworks.com` → service `chrono-web`, container port `80`, SSL on
- Health check: `/api/healthy` (goes through nginx to the API)
- Env file `.env` at the repo root with the variables in `.env.example`; only `chrono-api` reads it
- Stackport's own nginx must pass WebSocket upgrades for Socket.IO

Locally: `docker compose -f docker-compose.stackport.yml build`.

## Known limitations

- The web app calls its own origin for the API and Socket.IO, so it must be served together with the server
  (nginx in the Stackport setup, or the server itself with `SERVER_ONLY` unset); it can't be hosted alone.
- No persistence and no rate limiting; the admin upgrade endpoint is protected only by the admin credentials.
- `apps/server/package.json` still lists unused dependencies (Prisma, mysql2, neon, @nestjs/schedule), and
  `apps/web` lists `recharts`, which nothing imports now.
