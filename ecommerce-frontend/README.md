# E-commerce Catalog Frontend

A **Next.js + TypeScript** frontend for the e-commerce catalog, featuring authentication, product browsing, search, filtering, and infinite scrolling. Communicates with the NestJS backend.

## Tech Stack
- Next.js
- TypeScript
- React Context
- Fetch API
- Plain CSS

## Running
```bash
npm install
cp .env.local.example .env.local
npm run dev -- -p 3001
```

- Frontend: `http://localhost:3001`
- Requires the backend to be running first.

## Features
- User login with JWT authentication.
- Product catalog with:
  - Search (debounced)
  - Category filter
  - Adjustable page size
  - Infinite scrolling (`IntersectionObserver`)
- Sponsored products highlighted with a badge and disabled links.
- Automatic redirect to login on unauthorized access.

## State Management
- React Context for authentication.
- Local `useState` for catalog state (search, filters, pagination, products).

## Authentication
- JWT stored in `localStorage`.
- Automatically logs out and redirects on session expiration (`401`).

## Project Structure
- `/login` – Authentication page.
- `/products` – Product catalog with search, filters, and infinite scrolling.

## Future Improvements
- Product detail page.
- Loading skeletons.
- Migrate data fetching to SWR or React Query for scalability.