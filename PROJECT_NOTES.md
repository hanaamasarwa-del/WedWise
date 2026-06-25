# WedWise – Project Notes & Progress

Last updated: 2026-06-25

---

## What is WedWise?

An AI-powered wedding planning website for Israeli couples.
Users fill a Hebrew questionnaire → get a personalized report + supplier recommendations → can leave contact details for the agency.

The protected brief in `WedWise protected site brief.txt` is the source of truth for the product idea and must not be changed unless explicitly requested.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Hosting | Not deployed yet (runs locally) |
| AI (future) | Claude API |
| Image gen (future) | DALL-E or Stability AI |
| Notifications (future) | Telegram Bot |

---

## Credentials & Services

| Service | Details |
|---------|---------|
| Supabase project URL | https://wxtmeyivfgnuzfrackrk.supabase.co |
| GitHub repo | https://github.com/hanaamasarwa-del/WedWise |
| Backend runs on | http://localhost:3000 |

> ⚠️ API keys and secrets are stored in `server/.env` — this file is NOT on GitHub (protected by .gitignore).
> The documented template is `backend/.env.example`. Keep secrets out of committed files.

---

## Folder Structure

```
WedWise-temp/                         ← local clone of the GitHub repo
├── frontend/
│   ├── index.html        ← the website (Hebrew, RTL, multi-step form)
│   ├── styles.css        ← all styling
│   └── script.js         ← questionnaire logic + API calls to backend
│
├── backend/
│   └── database/
│       ├── demo_suppliers.json    ← Hebrew supplier demo data (synthetic only)
│       ├── venues_sharon.json     ← Sharon region venues
│       ├── demo_database.sqlite   ← SQLite copy of demo data
│       ├── seed.sql               ← SQL seed data
│       └── example_queries.sql    ← sample queries
│
├── server/
│   ├── index.js          ← Express entry point (also serves frontend)
│   ├── .env              ← secrets (NOT on GitHub)
│   ├── .env.example      ← template for .env
│   ├── package.json
│   │
│   ├── routes/
│   │   ├── submissions.js   ← POST/GET questionnaire answers
│   │   ├── aiReport.js      ← POST generate report (mock)
│   │   ├── image.js         ← POST generate image (placeholder)
│   │   ├── suppliers.js     ← GET supplier recommendations
│   │   └── leads.js         ← POST save contact details
│   │
│   ├── services/
│   │   ├── supabaseService.js    ← Supabase client (lazy init)
│   │   ├── aiReportService.js    ← mock report generation logic
│   │   ├── imageService.js       ← mock image generation logic
│   │   ├── supplierService.js    ← scoring & recommendation logic
│   │   └── telegramService.js    ← placeholder (logs to console for now)
│   │
│   ├── sql/
│   │   └── supabase_schema.sql   ← run this in Supabase SQL Editor to create tables
│   │
│   └── docs/
│       ├── api-contracts.md      ← all API endpoints documented
│       └── database-schema.md    ← all tables documented
│
├── PROJECT_NOTES.md   ← this file
└── WedWise protected site brief.txt
```

---

## Supabase Tables

| Table | Purpose |
|-------|---------|
| `submissions` | Questionnaire answers (budget, guests, region, style, colors, etc.) |
| `ai_reports` | Generated report per submission |
| `generated_images` | Image URL per submission |
| `suppliers` | Supplier catalog (future DB version — currently uses JSON file) |
| `leads` | Contact details submitted by users |

---

## API Endpoints

| Method | URL | What it does |
|--------|-----|-------------|
| GET | `/` | Serves the frontend (index.html) |
| GET | `/api/health` | Health check |
| POST | `/api/submissions` | Save questionnaire answers |
| GET | `/api/submissions/:id` | Get a submission by ID |
| POST | `/api/generate-report` | Generate mock AI report |
| POST | `/api/generate-image` | Generate placeholder image |
| GET | `/api/suppliers/recommendations?submissionId=` | Get ranked suppliers |
| POST | `/api/leads` | Save contact details + notify Telegram |

---

## How to Run Locally

1. Open Command Prompt (cmd)
2. Navigate to the server folder:
   ```
   cd C:\Users\itayg\OneDrive\Desktop\WedWise-temp\server
   ```
3. Start the server:
   ```
   node index.js
   ```
4. Open browser and go to:
   ```
   http://localhost:3000
   ```

---

## What's Done ✅

- [x] Supabase project created and all 5 tables set up
- [x] Backend server with all API routes (submissions, report, image, suppliers, leads)
- [x] Supplier recommendation engine (scores by region, budget, style match)
- [x] Mock AI report generation
- [x] Placeholder image generation
- [x] Placeholder Telegram service
- [x] Frontend questionnaire (5 steps, Hebrew, RTL)
- [x] Frontend connected to backend — data saves to Supabase
- [x] Site served at http://localhost:3000
- [x] Code pushed to GitHub

---

## What's Not Done Yet ❌

- [ ] Real AI report using Claude API (`AI_API_KEY` in `server/.env`)
- [ ] Real image generation (DALL-E or Stability AI — `IMAGE_API_KEY` in `server/.env`)
- [ ] Telegram bot integration (`TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` in `server/.env`)
- [ ] Deploy backend online (Railway recommended) so the site works without running locally
- [ ] Support chatbot on the site
- [ ] Merge open GitHub branches into main (needs repo owner approval)

---

## GitHub Branches

| Branch | Status | Contents |
|--------|--------|----------|
| `main` | live | base project + frontend |
| `feature/backend-server` | waiting to merge | full backend server |
| `feature/connect-frontend-to-backend` | waiting to merge | frontend connected to backend |

> Both branches need to be merged by the repo owner (hanaamasarwa-del) on GitHub.

---

## Implementation Notes

- Keep secrets in `server/.env`, using `server/.env.example` as the documented template.
- Demo supplier data in `backend/database/` is synthetic only — do not present as verified data.
- If real suppliers are added later, store the data source and review date.
- The supplier service reads from `backend/database/demo_suppliers.json` — to switch to Supabase DB suppliers later, update `services/supplierService.js`.
- The `supabaseService.js` uses lazy initialization — the server starts even without Supabase credentials (only DB calls will fail).

---

## Next Steps (in order)

1. Merge the two open branches into main on GitHub
2. Deploy the backend on Railway so the site works online for everyone
3. Connect Claude API to replace mock report with real AI
4. Connect image generation API to replace placeholder image
5. Set up Telegram bot to receive lead notifications
6. Add support chatbot to the site
