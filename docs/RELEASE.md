---
title: "Release Process"
module: "general"
date: "2026-03-09"
status: "completed"
related_features: []
---

# Release Process — Life Gauge

> Step-by-step guide for creating a new release of the Life Gauge application.

---

## Prerequisites

- All bug fixes / features are merged to `main` and tested
- Backend starts cleanly: `cd life-gauge-api && npm start`
- Frontend builds cleanly: `cd life-gauge-web && npx ng build`
- Docker Desktop is running (for image builds)
- You are authenticated to Docker Hub: `docker login`
- GitHub CLI is installed and authenticated: `gh auth status`

---

## Step 1: Bump Version Numbers

Update the version in **two** files:

| File | Field | Example |
|------|-------|---------|
| `life-gauge-api/package.json` | `"version": "X.Y.Z"` | `"version": "1.1.0"` |
| `life-gauge-web/package.json` | `"version": "X.Y.Z"` | `"version": "1.1.0"` |

No version changes are needed in Docker Compose files — they reference local builds or use the `LIFE_GAUGE_VERSION` environment variable at runtime.

---

## Step 2: Build and Verify

```bash
# Backend — install deps and run migrations against a local DB
cd life-gauge-api
npm install
npx knex migrate:latest --env production
npm start          # verify API starts on API_PORT

# Frontend — production build
cd ../life-gauge-web
npm install
npx ng build --configuration=production
```

Ensure both builds pass with zero errors.

---

## Step 3: Commit and Tag

```bash
cd /path/to/life-gauge

# Stage and commit version bump + all changes
git add life-gauge-api/package.json life-gauge-web/package.json
git commit -m "release: bump versions to vX.Y.Z"

# Create an annotated tag
git tag -a vX.Y.Z -m "Release vX.Y.Z"

# Push commit and tag
git push origin main
git push origin vX.Y.Z
```

---

## Step 4: Build and Push Docker Images

Docker Hub images use the naming convention:
- `kartikey31choudhary/life-gauge-api:<tag>`
- `kartikey31choudhary/life-gauge-web:<tag>`

Each release should push **two tags** per image: the version tag and `latest`.

```bash
cd /path/to/life-gauge

# Build API image
docker build \
  -t kartikey31choudhary/life-gauge-api:vX.Y.Z \
  -t kartikey31choudhary/life-gauge-api:latest \
  ./life-gauge-api

# Build Web image
docker build \
  -t kartikey31choudhary/life-gauge-web:vX.Y.Z \
  -t kartikey31choudhary/life-gauge-web:latest \
  ./life-gauge-web

# Push all tags
docker push kartikey31choudhary/life-gauge-api:vX.Y.Z
docker push kartikey31choudhary/life-gauge-api:latest
docker push kartikey31choudhary/life-gauge-web:vX.Y.Z
docker push kartikey31choudhary/life-gauge-web:latest
```

---

## Step 5: Create GitHub Release

```bash
gh release create vX.Y.Z \
  --title "Life Gauge vX.Y.Z" \
  --notes "$(cat <<'EOF'
## What's Changed

- [List bug fixes, features, improvements]

## Docker Images

Pull the latest images:
```
docker pull kartikey31choudhary/life-gauge-api:vX.Y.Z
docker pull kartikey31choudhary/life-gauge-web:vX.Y.Z
```

Or use docker-compose:
```
docker compose up -d
```
EOF
)"
```

---

## Quick Reference: Version Locations

| What | Where | Notes |
|------|-------|-------|
| Backend version | `life-gauge-api/package.json` → `version` | Used in npm metadata |
| Frontend version | `life-gauge-web/package.json` → `version` | Used in build metadata |
| Docker image tag | CLI build args (`-t ...:<tag>`) | Matches git tag |
| Git tag | `git tag -a vX.Y.Z` | Annotated tag on main |
| Compose runtime | `LIFE_GAUGE_VERSION` env var (optional) | Can pin image versions in production compose |

---

## Docker Compose — Production Notes

The `docker-compose.yml` at the project root builds images locally from source. For production deployments using pre-built Docker Hub images, create a `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    restart: unless-stopped
    env_file: .env
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    ports:
      - "${DB_PORT}:3306"
    volumes:
      - life_gauge_db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${DB_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    image: kartikey31choudhary/life-gauge-api:${LIFE_GAUGE_VERSION:-latest}
    restart: unless-stopped
    env_file: .env
    environment:
      DB_HOST: db
      DB_PORT: 3306
    expose:
      - "${API_PORT}"
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      db:
        condition: service_healthy
    command: >
      sh -c "
        echo 'Waiting for MySQL to accept connections...';
        until npx knex migrate:latest --env production; do
          echo 'MySQL not ready, retrying in 3s...';
          sleep 3;
        done;
        echo 'Migrations complete. Starting server...';
        node src/index.js
      "

  web:
    image: kartikey31choudhary/life-gauge-web:${LIFE_GAUGE_VERSION:-latest}
    restart: unless-stopped
    env_file: .env
    environment:
      API_PORT: ${API_PORT}
    ports:
      - "${NG_PORT}:80"
    depends_on:
      - api

volumes:
  life_gauge_db_data:
```

Deploy with:
```bash
LIFE_GAUGE_VERSION=vX.Y.Z docker compose -f docker-compose.prod.yml up -d
```

---

## Environment Setup for New Deployments

1. Copy `.env.example` to `.env` and fill in values
2. Key variables to configure:
   - `DB_PASSWORD` — MySQL root password
   - `JWT_SECRET` — random 32+ char string for JWT signing
   - `ENCRYPTION_KEY` — exactly 32 characters for AES-256 encryption
3. Default admin credentials: `admin` / `admin` (force password change on first login)

---

## Versioning Convention

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0) — Breaking changes, major redesigns, DB schema incompatibilities
- **MINOR** (0.X.0) — New features, new migrations, backward-compatible
- **PATCH** (0.0.X) — Bug fixes, small improvements, doc updates

Git tags are prefixed with `v`: `v1.0.0`, `v1.0.1`, `v1.1.0`, etc.
