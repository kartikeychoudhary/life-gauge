# Life Gauge

A web application for logging and monitoring personal health reports. Upload PDF lab reports, let Gemini AI extract and structure the results, then track trends over time on a categorized dashboard.

---

## Quick Start

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|---|---|
| `DB_PASSWORD` | MySQL root password |
| `JWT_SECRET` | Any long random string |
| `ENCRYPTION_KEY` | Exactly 32 characters (used to encrypt your Gemini API key at rest) |

### 2. Run with Docker (recommended)

```bash
docker-compose up
```

| Service | URL |
|---|---|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3000/api |
| MySQL | localhost:3306 |

Migrations run automatically on API startup.

### 3. Run standalone (for development)

**Backend**
```bash
cd life-gauge-api
npm install
npx knex migrate:latest      # run DB migrations
npx knex seed:run            # optional: seed a dev user
npm run dev                  # starts with nodemon on port 3000
```

**Frontend**
```bash
cd life-gauge-web
npm install
ng serve                     # starts on port 4200
```

---

## Project Structure

```
life-gauge/
├── life-gauge-api/       # Node.js / Express backend
├── life-gauge-web/       # Angular frontend
├── docs/                 # All project documentation
├── docker-compose.yml
├── .env.example          # Environment variable template
└── README.md
```

---

## Documentation

| File | Description |
|---|---|
| [docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md) | High-level overview — modules, tech stack, DB tables |
| [docs/PROJECT_HISTORY.md](docs/PROJECT_HISTORY.md) | Chronological changelog of features and fixes |
| [docs/API_SPEC.md](docs/API_SPEC.md) | Full REST API reference (endpoints, request/response shapes) |
| [docs/BACKEND_SPEC.md](docs/BACKEND_SPEC.md) | DB schema, migrations, backend architecture decisions |
| [docs/DEVELOPMENT_PROCESS.md](docs/DEVELOPMENT_PROCESS.md) | Step-by-step process for adding features |
| [docs/MISTAKES.md](docs/MISTAKES.md) | Error and retry log (maintained by Claude) |
| [docs/feature/](docs/feature/) | Per-feature docs split by `api/` and `web/` |

---

## Adding a Feature

See [docs/DEVELOPMENT_PROCESS.md](docs/DEVELOPMENT_PROCESS.md) for the full workflow. In brief:

1. Re-read `docs/MISTAKES.md` before starting
2. Create a Knex migration for any schema change: `cd life-gauge-api && npx knex migrate:make <name>`
3. Add service → controller → routes in the relevant backend module
4. Generate Angular components: `ng generate component <path> --module=<module> --standalone=false`
5. After completing, update `docs/PROJECT_SUMMARY.md`, `docs/PROJECT_HISTORY.md`, `docs/API_SPEC.md`, `docs/BACKEND_SPEC.md`, and create per-feature docs in `docs/feature/api/` and `docs/feature/web/`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js 20 LTS |
| Backend framework | Express 4 |
| Database | MySQL 8 |
| Query builder | Knex.js |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| File upload | multer |
| PDF extraction | pdf-parse |
| AI parsing | Google Gemini (`@google/generative-ai`) |
| Frontend framework | Angular 21 (module-based, non-standalone) |
| UI components | PrimeNG 21 |
| CSS framework | Tailwind CSS 3 |
| Data grid | AG Grid Community |

---

## Deployment

### Environment

All configuration is in a single `.env` file at the project root. Never commit this file — it is git-ignored. Commit `.env.example` to keep the template in sync.

### Docker production build

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f api
docker-compose logs -f web

# Stop
docker-compose down
```

### Database migrations in production

Migrations run automatically when the API container starts (see `docker-compose.yml` entrypoint). To run manually:

```bash
docker-compose exec api npx knex migrate:latest
```

### Rollback a migration

```bash
cd life-gauge-api
npx knex migrate:rollback
```
