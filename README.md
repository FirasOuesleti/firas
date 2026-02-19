# Dashboard — Next.js + NestJS + MySQL

Production monitoring dashboard: stop tracking, cause management, métrage, vitesse.

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- **MySQL** 8.x (or use Docker)

## Quick Start (local)

### 1. Backend

```bash
cd back
cp .env.example .env        # ← edit with real credentials
npm install
npm run start:dev            # http://localhost:3001
```

### 2. Frontend

```bash
cd front
cp .env.example .env.local   # ← adjust API URL if needed
npm install
npm run dev                  # http://localhost:3000
```

### 3. Database

Import the schema from `DBase/`:

```bash
mysql -u root -p dashboard < DBase/00_RUNBOOK.sql
```

## Quick Start (Docker)

```bash
cp back/.env.example back/.env   # ← edit credentials
docker-compose up --build -d
```

| Service  | URL                            |
|----------|--------------------------------|
| Frontend | <http://localhost:3000>           |
| Backend  | <http://localhost:3001>           |
| Swagger  | <http://localhost:3001/api/docs>  |
| MySQL    | localhost:3306                  |

## Project Structure

```
├── back/           NestJS API (TypeORM + MySQL)
├── front/          Next.js frontend
├── DBase/          SQL schema & migrations
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Environment Variables

### Backend (`back/.env`)

| Variable              | Required | Description                          |
|-----------------------|----------|--------------------------------------|
| `DB_HOST`             | ✅       | MySQL host                           |
| `DB_PORT`             | ✅       | MySQL port (default: 3306)           |
| `DB_USER`             | ✅       | MySQL user                           |
| `DB_PASSWORD`         | ✅       | MySQL password                       |
| `DB_NAME`             | ✅       | Database name                        |
| `PORT`                |          | API port (default: 3001)             |
| `JWT_SECRET`          | ✅       | ≥ 32 chars                           |
| `CORS_ORIGINS`        |          | Comma-separated origins              |
| `ADMIN_EMAIL`         | ✅       | Admin login email                    |
| `ADMIN_PASSWORD`      | ⚠️       | Plain password (dev only)            |
| `ADMIN_PASSWORD_HASH` | ⚠️       | Bcrypt hash (production)             |

> One of `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH` is required.

### Frontend (`front/.env.local`)

| Variable              | Required | Description                 |
|-----------------------|----------|-----------------------------|
| `NEXT_PUBLIC_API_URL` | ✅       | Backend URL                 |

## Scripts

### Backend

| Command               | Description            |
|-----------------------|------------------------|
| `npm run start:dev`   | Watch mode             |
| `npm run build`       | Compile to `dist/`     |
| `npm run start:prod`  | Run compiled output    |
| `npm run lint`        | ESLint                 |
| `npm test`            | Jest                   |

### Frontend

| Command          | Description               |
|------------------|---------------------------|
| `npm run dev`    | Dev server (port 3000)    |
| `npm run build`  | Production build          |
| `npm run lint`   | ESLint                    |

## Destructive Scripts

⚠️ `back/drop-table.js` **refuses** to run in production and requires:

```bash
NODE_ENV=development I_UNDERSTAND_THIS_WILL_DROP_DATA=YES node drop-table.js
```
