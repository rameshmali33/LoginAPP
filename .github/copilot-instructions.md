<!-- Copilot / AI agent instructions for LoginAPP -->
# Copilot instructions — LoginAPP (Employee Management)

Purpose
- Help contributors navigate a two-tier React + Node/Express codebase backed by PostgreSQL. Focus on discoverable patterns, run/dev commands, integration points, and repository/service/controller responsibilities.

Big picture
- Backend: Node.js + Express in `backend/` (entry: `backend/server.js`). API base path: `/api`. Swagger UI is at `/api-docs`.
- Frontend: Create React App in `frontend/` (source: `frontend/src/`). Static production build output lives in `frontend/build/`.
- DB: PostgreSQL connection via `backend/config/db.js` (uses `process.env.DATABASE_URL`, SSL enabled). Run SQL migrations with `node run_migration.js` from `backend/`.

Key runtime commands
- Backend dev: `cd backend && npm install && npm run dev` (uses `nodemon`).
- Backend start: `cd backend && npm start`.
- Run migrations: `cd backend && node run_migration.js` (executes `migrations/create_leave_tables.sql`).
- Frontend dev: `cd frontend && npm install && npm start`.
- Frontend build: `cd frontend && npm run build`.

Project patterns & conventions (concrete)
- Route naming: API endpoints are grouped under `backend/routes/*.js` and mounted in `server.js` (example: `backend/routes/leaves.js` mounted at `/api/leaves`).
- Layering: `controllers` → `services` → `repositories`.
  - Controllers (e.g. `backend/controllers/leaveController.js`) validate input with `Joi` and call service methods.
  - Services (e.g. `backend/services/leaveService.js`) contain business logic and transaction boundaries. They use `pool.connect()` and pass `client` to repository functions for ACID operations.
  - Repositories perform direct SQL against `pg` pool (look in `backend/repositories/`).
- Transactions: When mutating multiple tables (leave approval flow), the service opens a client, `BEGIN`/`COMMIT`/`ROLLBACK`, and passes the client into repository functions (pattern used in `reviewByManager` / `reviewByHR`). Follow this pattern for multi-step DB updates.
- Role-based access: Routes require `authMiddleware` and use `roleMiddleware("employee","manager","hr","admin")` to gate endpoints (see `backend/routes/leaves.js`). Role strings are literal values used throughout.
- File uploads: `multer` is used; uploads are served statically from `/uploads` via `express.static(path.join(__dirname, 'uploads'))` in `server.js`.
- Validation & errors: Controllers use `Joi` schemas and typically return `400` for validation/application errors and `500` for server errors. Mirror these responses when adding endpoints.

Environment variables (observed)
- `PORT` — server listen port.
- `DATABASE_URL` — Postgres connection string (SSL configured in `db.js`).
- `JWT_SECRET` — token signing/verification used by `authMiddleware`.
- `BREVO_API_KEY`, `EMAIL_USER` — mail sending (see `backend/config/mailer.js`).
  - Note: `backend/server.js` expects a `transporter` object for `test-email` which may differ from the exported `sendEmail` helper; verify mailer shape before modifying email code.

Debugging & quick checks
- API docs: run backend and open `http://localhost:<PORT>/api-docs` to inspect endpoints and request shapes.
- Database: to apply schema changes or create tables locally, run `node run_migration.js` from `backend/`.
- Logs: backend uses console logging; inspect server output for stack traces.

When editing code
- Use the existing layering: add SQL in repository, call it from service, and expose via controller. For transactional work, prefer `client = await pool.connect()` and pass `client` to repo functions.
- Reuse existing Joi schemas style in controllers. Keep responses consistent with current patterns (JSON with `message`, `error` when relevant).

Files to inspect for context
- `backend/server.js`, `backend/routes/leaves.js`, `backend/controllers/leaveController.js`, `backend/services/leaveService.js`, `backend/repositories/*`, `backend/config/db.js`, `backend/run_migration.js`, `frontend/src/`.

If unsure, ask the maintainer for:
- missing/expected `.env` example (sensible defaults for local dev)
- intended mailer export shape (transporter vs sendEmail helper)

End of instructions — please review and tell me any missing project details to refine this file.
