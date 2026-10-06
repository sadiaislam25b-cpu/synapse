# Synapse

A neurotech news and research hub that pulls together industry news, academic papers, and company data in one place.

![Synapse screenshot](docs/screenshot.png)
<!-- Replace docs/screenshot.png with an actual screenshot of the app (create the docs/ folder if it doesn't exist yet). -->

## Features

- **News** — latest neurotech headlines pulled from The Guardian
- **Research** — recent papers pulled from PubMed and arXiv
- **Company map** — explore neurotech companies and where they're based
- **Search** — search across news, papers, and companies
- **Particle brain** — interactive 3D brain visualization on the home page
- **Accounts** — sign up / log in, and save ("heart") articles and papers to revisit later

## Tech stack

**Client**
- React 19 + Vite
- React Router for page navigation
- react-three-fiber / three.js for the 3D particle brain visualization

**Server**
- Node.js + Express 5 (ES modules)
- PostgreSQL via `pg`
- express-session + connect-pg-simple for session-backed auth (sessions stored in Postgres)
- bcryptjs for password hashing
- fast-xml-parser for parsing arXiv's XML feed

## Architecture

The client (Vite dev server, port 5173) proxies any request to `/api` over to the Express server (port 3001), so the browser only ever talks to one origin during development. The server exposes a JSON API backed by PostgreSQL:

- `companies`, `articles`, and `papers` hold the core content, periodically refreshed from external sources (`fetchNews.js`, `fetchPapers.js`)
- `users` and `saves` back authentication and the "save/heart" feature, with sessions persisted in a `session` table via connect-pg-simple
- Auth state is cookie-based (`express-session`); the client reads the current user from a session-check endpoint via `AuthContext`

In production, the Express server also serves the client's built static files, so the whole app is reachable from a single URL.

## Running locally

**Prerequisites:** Node.js, PostgreSQL running locally.

1. Create a local Postgres database (e.g. `synapse`) and run `server/schema.sql` against it to create the tables.
2. In `server/`, create a `.env` file with the required variables (see below), then install dependencies and start the API:
   ```
   cd server
   npm install
   npm run dev
   ```
3. In a separate terminal, install and start the client:
   ```
   cd client
   npm install
   npm run dev
   ```
4. Open the client at `http://localhost:5173`. It proxies `/api` requests to the server at `http://localhost:3001`.

Optionally, run `node seed.js` from `server/` to seed the companies table.

## Environment variables

Set these in `server/.env` (never commit this file):

- `DATABASE_URL`
- `GUARDIAN_API_KEY`
- `SESSION_SECRET`
- `PORT` (optional locally; defaults to 3001)

## Data sources

- [The Guardian](https://open-platform.theguardian.com/) — news
- [PubMed](https://pubmed.ncbi.nlm.nih.gov/) — research papers
- [arXiv](https://arxiv.org/) — research papers
