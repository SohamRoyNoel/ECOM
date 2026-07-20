# E-commerce Catalog Backend

A **NestJS + PostgreSQL + TypeORM** backend providing JWT authentication, protected product catalog APIs, search, filtering, infinite scroll, and sponsored product placement.

## Tech Stack
- NestJS
- PostgreSQL + TypeORM
- Redis
- Docker Compose
- JWT Authentication
- Argon2 Password Hashing

## Running
```bash
cp .env.example .env
# Set JWT_SECRET
docker compose up --build
```

- API: `http://localhost:3002`
- Health Check: `GET /health`

## Demo Login
- Username: `bob` (or other seeded users)
- Password: `Password@2026`

Returns a JWT to be used as:
```
Authorization: Bearer <token>
```

## Authentication
- JWT-based authentication with server-side session management.
- Idle session timeout (default **1 hour**).
- JWT expiry: **12 hours**.
- Logout immediately revokes the session.

## Security
- Redis-backed login rate limiting.
- Per-IP request limiting.
- Account lockout after repeated failed logins.
- Generic authentication error responses to prevent account enumeration.

## Product Catalog
- Protected APIs for products and categories.
- Features:
  - Full-text search (`tsvector` + GIN index)
  - Fuzzy typo search (`pg_trgm`)
  - Category filtering
  - Infinite scrolling
  - Offset pagination for search results
  - Keyset pagination for browsing
- Dataset: **5,000 products** across **10 categories**.

## Sponsored Products
- Displayed at positions **5, 10, 20, 40, 80...**
- Excluded from pagination count and search results.
- Returned with `isSponsored: true`.

## Database
- Migration-based schema management (no `synchronize`).
- Three migrations:
  - PostgreSQL extensions
  - Database schema
  - Seed data

## Architecture
Project architecture diagrams are available in:
```
docs/
```

## Future Improvements
- Refresh tokens
- Sponsored click tracking
- Integration tests
- Improved sponsored product rotation