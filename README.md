# WedWise

WedWise is a future static HTML/CSS wedding-planning website based on the protected site brief.

Project created: June 25, 2026.

## GitHub Repository

Public repository: https://github.com/hanaamasarwa-del/WedWise

## Required Context

At the beginning of every future CLI session, read:

1. `README.md`
2. `WedWise protected site brief.txt`

## Files And Rules

- `WedWise protected site brief.txt` contains the site brief and execution instructions.
- Do not rewrite, reorganize, remove, or otherwise change `WedWise protected site brief.txt` unless the user explicitly asks for that exact change.
- `README.md` is the single place for durable project context and important session notes.
- `frontend/index.html` and `frontend/styles.css` are intentionally empty placeholders for the future site build.

## Memory Policy

Record only durable context that future sessions need: project decisions, important user preferences, implementation milestones, and constraints.

Keep notes short. Skip routine file operations, temporary recovery steps, and details that are already obvious from the current files.

Use dates only in project documentation and session notes. Do not include times or timezones.

## Current Status

- Initial project setup and synthetic demo database assets are in place.
- Site implementation has not started yet.

## Project Structure

- `README.md`
- `WedWise protected site brief.txt`
- `frontend/`
  - `index.html`
  - `styles.css`
- `backend/`
  - `.env.example`
  - `README.md`
  - `database/`

## Database Demo Assets

`backend/database/` contains synthetic supplier data for development and demo use only:

- `README.md` - database usage notes and data-safety rules.
- `seed.sql` - canonical SQLite schema and seed data.
- `demo_database.sqlite` - ready-to-open SQLite database generated from the seed.
- `demo_suppliers.json` - JSON export of the demo supplier catalog.
- `example_queries.sql` - sample lookup, request, report, and lead queries.

## Backend Secrets

OpenAI credentials must be stored only as the backend environment variable `OPENAI_API_KEY`. Never place API keys in frontend HTML, CSS, JavaScript, source code, or Git history.

Use `backend/.env.example` as the template for local configuration. The real `backend/.env` file is ignored by Git. Production credentials must be configured through the hosting provider's secret manager.

## Session Notes

- 2026-06-25: Project created as a new repository with the initial setup and synthetic demo supplier database assets.
- 2026-06-25: Project reorganized into `frontend/` and `backend/` directories.
- 2026-06-25: Added secure backend environment configuration for future OpenAI features.
