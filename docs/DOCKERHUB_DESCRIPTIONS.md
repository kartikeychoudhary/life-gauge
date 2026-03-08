## kartikey31choudhary/life-gauge-api

```
## Life Gauge — API

Node.js Express backend for [Life Gauge](https://github.com/kartikeychoudhary/life-gauge), a health report tracking application.

### Quick Start

docker pull kartikey31choudhary/life-gauge-api:latest

Use with [docker-compose.prod.yml](https://github.com/kartikeychoudhary/life-gauge/blob/main/docker-compose.prod.yml) for full stack deployment. See the [README](https://github.com/kartikeychoudhary/life-gauge#option-3-production-deployment-pre-built-docker-hub-images) for setup instructions.

### What's Included

- Express 4 REST API with JWT authentication
- Knex.js migrations (run automatically on startup)
- PDF upload + Google Gemini AI parsing
- 111+ health test definitions with medical descriptions
- Admin endpoints for user/settings/test management
- Default admin user created on first run (admin@lifegauge.local / admin)

### Environment

Requires a .env file — see [.env.example](https://github.com/kartikeychoudhary/life-gauge/blob/main/.env.example) for all variables.

### Links

- [Source Code](https://github.com/kartikeychoudhary/life-gauge/tree/main/life-gauge-api)
- [API Specification](https://github.com/kartikeychoudhary/life-gauge/blob/main/docs/API_SPEC.md)
- [Full Documentation](https://github.com/kartikeychoudhary/life-gauge/tree/main/docs)
- [Releases](https://github.com/kartikeychoudhary/life-gauge/releases)
```

---

## kartikey31choudhary/life-gauge-web

```
## Life Gauge — Web

Angular frontend for [Life Gauge](https://github.com/kartikeychoudhary/life-gauge), a health report tracking application. Served via nginx with reverse proxy to the API.

### Quick Start

docker pull kartikey31choudhary/life-gauge-web:latest

Use with [docker-compose.prod.yml](https://github.com/kartikeychoudhary/life-gauge/blob/main/docker-compose.prod.yml) for full stack deployment. See the [README](https://github.com/kartikeychoudhary/life-gauge#option-3-production-deployment-pre-built-docker-hub-images) for setup instructions.

### What's Included

- Angular 21 SPA (PrimeNG 21 dark theme + Tailwind CSS 3)
- Dashboard with categorized test cards, trend indicators, and reference range bars
- Test history charts with Chart.js and medical descriptions
- Health report upload with real-time SSE processing status
- Admin panel (user management, signup control, test definitions)
- nginx serving static files + proxying /api/ to the backend container

### Environment

Requires API_PORT and NG_PORT from .env — see [.env.example](https://github.com/kartikeychoudhary/life-gauge/blob/main/.env.example).

### Links

- [Source Code](https://github.com/kartikeychoudhary/life-gauge/tree/main/life-gauge-web)
- [Full Documentation](https://github.com/kartikeychoudhary/life-gauge/tree/main/docs)
- [Releases](https://github.com/kartikeychoudhary/life-gauge/releases)
```
