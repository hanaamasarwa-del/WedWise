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
- `frontend/` contains the active static website files.
- `backend/.env.example` documents backend environment variables. Copy it to `backend/.env` and fill real secrets only on the local machine.
- `PROJECT_NOTES.md` keeps short durable implementation notes separate from the protected brief.

## Memory Policy

Record only durable context that future sessions need: project decisions, important user preferences, implementation milestones, and constraints.

Keep notes short. Skip routine file operations, temporary recovery steps, and details that are already obvious from the current files.

Use dates only in project documentation and session notes. Do not include times or timezones.

## Current Status

- Initial project setup and synthetic demo database assets are in place.
- The first static frontend implementation is in place.
- Basic project support files are in place: `.gitignore`, `backend/.env.example`, and `PROJECT_NOTES.md`.

## Project Structure

- `README.md`
- `.gitignore`
- `PROJECT_NOTES.md`
- `WedWise protected site brief.txt`
- `frontend/`
  - `index.html`
  - `styles.css`
  - `script.js`
- `backend/`
  - `.env.example`
  - `package.json`
  - `server.js`
  - `database/`

## Database Demo Assets

`backend/database/` contains synthetic supplier data for development and demo use only:

- `README.md` - database usage notes and data-safety rules.
- `seed.sql` - canonical SQLite schema and seed data.
- `demo_database.sqlite` - ready-to-open SQLite database generated from the seed.
- `demo_suppliers.json` - JSON export of the demo supplier catalog.
- `example_queries.sql` - sample lookup, request, report, and lead queries.

## Local Application

Run the site and backend together:

```bash
cd backend
npm start
```

Then open `http://localhost:3000`. Form submissions are sent through the backend to Telegram. Configure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in the ignored `backend/.env` file or as deployment secrets.

## Session Notes

- 2026-06-25: Project created as a new repository with the initial setup and synthetic demo supplier database assets.
- 2026-06-25: Project reorganized into `frontend/` and `backend/` directories.
- 2026-06-25: Added basic support files for local development notes, environment documentation, ignore rules, and the future JavaScript entry point.
- 2026-06-25: Consolidated the active website files under `frontend/` and backend configuration under `backend/`.
- 2026-06-25: Added secure Telegram notifications for complete form submissions.
