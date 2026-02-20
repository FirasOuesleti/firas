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


