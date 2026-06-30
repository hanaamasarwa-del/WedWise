# WedWise

WedWise is a working wedding-planning web application that helps couples begin
planning through a guided questionnaire, an initial personalized report, human
follow-up, and an AI support chatbot.

The active application uses a static HTML/CSS/JavaScript frontend served by an
Express backend. The backend keeps API keys and notification credentials away
from the browser.

Project created: June 25, 2026.

Repository: https://github.com/hanaamasarwa-del/WedWise

## Product Overview

The current website lets a visitor:

1. Learn how the WedWise planning process works.
2. Complete a six-step wedding questionnaire.
3. Move between the main page, planning questionnaire, countdown tool, wedding
   blessing writing page, and tips/guides page from one consistent navigation
   menu.
4. Enter a budget, guest count, region, style, colors, flowers, decorations,
   personal notes, an optional inspiration link, and contact details.
5. Receive an initial browser-generated planning report with a suggested budget
   breakdown, design direction, supplier categories, and next steps.
6. Review the report, edit questionnaire answers if needed, confirm the report,
   and generate a realistic wedding visualization from the confirmed report.
7. Save the generated wedding visualization from the preview modal.
8. Choose whether to continue organizing the wedding with WedWise or think
   about it first; the decision is saved and sent to the agency Telegram bot.
9. Create a wedding countdown card, write a wedding blessing draft, and browse
   practical wedding-planning tips from dedicated pages.
10. Open a wedding invitation editor from the report flow and export the
   invitation as PNG or print/save it as PDF.
11. Send the completed questionnaire to the agency through Telegram.
12. Open a floating AI support chatbot for short questions about WedWise and how
   to use the website.

The protected product brief also describes future work such as deeper
AI-generated reports, database-backed supplier matching, saved submissions, and
a more complete agency follow-up flow. These planned features must not be
presented as complete until they are connected to the active frontend and
verified.

## Current Implementation Status

Working in the active user flow:

- Responsive Hebrew landing page with polished hero, inspiration, benefits, and
  footer sections.
- Shared top navigation across all frontend pages.
- Protected landing hero image with subtle petal motion.
- Six-step questionnaire with validation and back/next navigation.
- Wedding countdown helper page.
- Wedding blessing writing page, labeled `כתיבת ברכה` in the navigation.
- Wedding tips/guides page, labeled `טיפים ומדריכים`, with a visual tips grid,
  expanded guide reader, and supplier-meeting checklist.
- Wedding invitation editor, reachable from the report flow, with Hebrew,
  English, and Arabic invitation text modes plus PNG/PDF export options.
- Local initial report generation.
- Report review flow with answer editing, explicit report confirmation, wedding
  image generation, preview modal, image download, final follow-up decision,
  Telegram notification, and Supabase follow-up persistence.
- Venue recommendation modal based on the questionnaire's region, budget, and
  guest count. The data source is local demo JSON under `backend/data/venues/`.
- Telegram delivery of completed questionnaire details.
- Optional Supabase persistence for questionnaire submissions, leads, reports,
  and follow-up decisions when Supabase credentials are configured.
- Closed-by-default floating chatbot on every active frontend page.
- OpenAI Responses API integration using `gpt-5.4-mini`.
- OpenAI Images API integration using `gpt-image-1`.
- Wedding blessing generation through the backend with OpenAI.
- Optional countdown-card AI design generation from an uploaded inspiration
  image when `OPENAI_API_KEY` is configured.
- Server-side API key handling.
- Basic chatbot and form rate limiting.

Present in the backend but not part of the primary local report flow:

- Mock report persistence.
- Demo supplier recommendation routes under `/api/suppliers/recommendations`,
  which require a saved Supabase submission.

Important limitations:

- The displayed planning report is currently generated locally in the browser,
  not by an AI report service.
- Wedding image generation, blessing generation, and AI countdown design require
  `OPENAI_API_KEY` on the backend.
- Supplier records are synthetic demo data and must never be presented as
  verified businesses, prices, recommendations, or availability.
- Invitation editing is frontend-only and uses browser state/local storage for
  report context. It is not persisted server-side.
- Sending contact details requests follow-up; it does not confirm a booking,
  supplier, price, or response time.

## Technology

- Frontend: HTML, CSS, and vanilla JavaScript.
- Server: Node.js and Express.
- AI chatbot: OpenAI Responses API.
- Chatbot model: `gpt-5.4-mini` by default.
- Navigation label for the blessing tool: `כתיבת ברכה`.
- Navigation label for the content hub: `טיפים ומדריכים`.
- Notifications: Telegram Bot API.
- Optional persistence routes: Supabase/PostgreSQL.
- Venue recommendation assets: local JSON files under `backend/data/venues/`.
- Demo supplier assets: SQLite, SQL seed data, and JSON.

Node.js 22 or newer is required by the root `package.json`. The backend also
uses the built-in `fetch` API.

## Local Setup

From the repository root:

```bash
npm install
```

Create `backend/.env` from `backend/.env.example`, then provide the credentials
needed for the features you want to run.

Start the application:

```bash
npm start
```

The root `npm start` command runs `node backend/index.js`. You can also work
from the backend package directly:

```bash
cd backend
npm run dev
```

Open:

```text
http://localhost:3000
```

The Express server serves both the frontend and the API.

## Environment Variables

The active backend reads `backend/.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | Local server port. Defaults to `3000`. |
| `OPENAI_API_KEY` | For AI features | OpenAI API key for chatbot and wedding image generation. Never expose it in frontend code. |
| `OPENAI_CHAT_MODEL` | No | Chatbot model override. Defaults to `gpt-5.4-mini`. |
| `OPENAI_IMAGE_MODEL` | No | Image generation model override. Defaults to `gpt-image-1`. |
| `OPENAI_IMAGE_SIZE` | No | Image generation size override. Defaults to `1024x1024`. |
| `OPENAI_IMAGE_QUALITY` | No | Image generation quality override. Defaults to `medium`. |
| `TELEGRAM_BOT_TOKEN` | For form delivery | Telegram bot credential used by the server. |
| `TELEGRAM_CHAT_ID` | Sometimes | Destination chat. Optional only when exactly one private chat has sent `/start` to the bot. |
| `SUPABASE_URL` | For Supabase routes | Supabase project URL. |
| `SUPABASE_ANON_KEY` | Optional | Supabase anonymous key where applicable. |
| `SUPABASE_SERVICE_ROLE_KEY` | For privileged persistence | Server-only Supabase service role key. |
| `AI_API_KEY` | Legacy fallback | Accepted as a fallback by AI routes if `OPENAI_API_KEY` is absent. Prefer `OPENAI_API_KEY`. |
| `IMAGE_API_KEY` | Legacy fallback | Accepted as a fallback by image generation if `OPENAI_API_KEY` is absent. Prefer `OPENAI_API_KEY`. |

Never commit `backend/.env` or any real secret.

## Frontend Pages

The active frontend is intentionally static. Each page is a standalone HTML
entry point served by Express:

| Page | Purpose |
| --- | --- |
| `frontend/index.html` | Landing page, questionnaire entry, report flow, image generation, venue recommendations, and final follow-up decision. |
| `frontend/questionnaire.html` | Dedicated questionnaire page using the shared questionnaire/report script. |
| `frontend/countdown.html` | Wedding countdown card builder with optional AI design generation from an inspiration image. |
| `frontend/blessing-helper.html` | Wedding blessing/speech generator. |
| `frontend/articles.html` | Tips and guides hub labeled `טיפים ומדריכים`, with quick tips, deeper guide reader, and supplier-meeting checklist. |
| `frontend/invitation.html` | Invitation editor reached from the report flow, with PNG/PDF export. |
| `frontend/about.html` | About page. |
| `frontend/faq.html` | FAQ page. |

Most pages share `frontend/styles/site.css` and the floating chatbot from
`frontend/scripts/chat-widget.js`. Page-specific styles live in
`frontend/styles/countdown.css` and `frontend/styles/blessing-helper.css`.

## Chatbot

The chatbot appears as a floating button in the corner of the screen. It is
closed when the page loads and opens only when the visitor clicks it. The active
frontend pages all load `frontend/scripts/chat-widget.js`, which owns the widget
behavior and normalizes older page markup.

The browser sends chat history to:

```text
POST /api/chat
```

The server calls OpenAI, so the API key is never sent to the browser.

## Wedding Image Generation

After a visitor completes the questionnaire, the browser renders the initial
report. The visitor can either edit the answers or confirm the report. Once the
report is confirmed, the confirm button is replaced with the wedding image
generation button.

The frontend sends the confirmed report text and structured questionnaire
details to:

```text
POST /api/generate-image
```

The backend builds a photorealistic wedding visualization prompt and calls the
OpenAI Images API. The generated image is shown in a modal with a download
button. The modal also lets the visitor choose whether to continue organizing
the wedding with WedWise or think about it first. Both choices are saved to
Supabase and sent to the configured Telegram bot when those services are
configured. If Supabase is unavailable but Telegram is configured, the backend
still notifies the team and reports the database status in the API response.
The OpenAI API key stays server-side in `backend/.env`.

Required for real image generation:

```env
OPENAI_API_KEY=
```

Optional image overrides:

```env
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=medium
```

## Other AI Tools

The blessing page posts to:

```text
POST /api/generate-blessing
```

This route currently uses the OpenAI Chat Completions API with `gpt-4o-mini`
and writes Hebrew blessing text according to the selected speaker, couple
names, tone, length, and optional personal details.

The countdown page can optionally generate an AI-designed countdown image from
an uploaded inspiration image:

```text
POST /api/generate-countdown-design
```

That route analyzes the uploaded image with `gpt-4o-mini`, then generates a
countdown design image. It requires `OPENAI_API_KEY` and is separate from the
regular browser-rendered countdown card.

Chatbot behavior:

- Answers only questions related to WedWise and using the website.
- Refuses unrelated general-knowledge requests.
- Replies in the visitor's language.
- Keeps answers short and conversational, normally one or two sentences.
- Uses plain text without Markdown styling, arrows, decorative symbols, or
  gender-slash wording.
- Knows the current page structure, questionnaire, report, limitations, and
  planned product direction, including the tips/guides page.
- Does not claim that prices, bookings, suppliers, or availability are
  confirmed.

The chatbot's knowledge and behavior instructions are stored in
`backend/services/chat-service.js` in the `SITE_CONTEXT` constant.

### Required Chatbot Maintenance

Every user-facing website change must include a chatbot knowledge review.

When a page section, field, report output, supplier flow, contact flow,
limitation, product promise, or visible feature is added, removed, renamed, or
changed:

1. Review and update `SITE_CONTEXT`.
2. Keep current working features separate from planned features.
3. Keep the bot restricted to WedWise-related questions and short answers.
4. Test one relevant question.
5. Test one unrelated question and confirm that the bot refuses it.

This review is part of the definition of done for every future user-facing
change.

## Protected Visual Decisions

The landing hero image and floating petal animation are currently approved as
the stable first impression of the site. Do not replace the hero image, remove
the petal layer, or substantially change the entrance animation without explicit
design approval. The relevant files are:

- `frontend/index.html` for the protected hero markup.
- `frontend/styles/site.css` for `hero-petals`, `petalDrift`, and the hero entrance
  animation.

## Telegram Setup

1. Create or select a Telegram bot.
2. Add its token to `TELEGRAM_BOT_TOKEN`.
3. Send `/start` to the bot from the destination private chat.
4. Set `TELEGRAM_CHAT_ID` explicitly if the bot has more than one private chat.

The active questionnaire posts to `/api/telegram-lead`. If Telegram delivery
fails, the frontend still displays the local report and logs a warning in the
browser console.

## Supabase and Demo Data

The Supabase schema is stored at:

```text
backend/database/supabase-schema.sql
```

Backend routes for submissions, reports, images, suppliers, and leads are
documented in:

- `docs/api-contracts.md`
- `docs/database-schema.md`

Synthetic supplier assets are stored in `data/demo-suppliers/`:

- `schema-and-seed.sql`
- `wedwise-demo.sqlite`
- `suppliers.demo.json`
- `example-queries.sql`
- `sharon-venues.reference.json`
- `README.md`

These records exist only for development, matching-flow tests, and project
demonstrations. Keep the SQL, SQLite, and JSON versions synchronized when the
dataset changes.

Venue recommendation data used by `/api/venues/recommend` lives separately in:

```text
backend/data/venues/
```

Those venue JSON files are development/demo assets. Keep their source,
freshness, and production readiness clear before presenting them as real
recommendations.

## API Summary

| Method | Endpoint | Status |
| --- | --- | --- |
| `GET` | `/api/health` | Active health check. |
| `POST` | `/api/chat` | Active OpenAI chatbot endpoint. |
| `POST` | `/api/telegram-lead` | Active questionnaire notification endpoint. |
| `POST` | `/api/submissions` | Available; requires Supabase. |
| `GET` | `/api/submissions/:id` | Available; requires Supabase. |
| `POST` | `/api/generate-report` | Available; currently uses mock report logic and Supabase. |
| `POST` | `/api/generate-image` | Active OpenAI Images endpoint for confirmed report visualizations. |
| `POST` | `/api/generate-blessing` | Active OpenAI blessing/speech generation endpoint. |
| `POST` | `/api/generate-countdown-design` | Optional OpenAI countdown design endpoint; requires uploaded image and API key. |
| `POST` | `/api/wedding-follow-up` | Active final decision endpoint; saves to Supabase and notifies Telegram. |
| `POST` | `/api/venues/recommend` | Active local venue recommendation endpoint using `backend/data/venues/`. |
| `GET` | `/api/suppliers/recommendations` | Available; uses demo suppliers and a saved submission. |
| `POST` | `/api/leads` | Available; requires Supabase and optionally Telegram. |

## Project Structure

```text
WedWise/
|-- frontend/
|   |-- index.html
|   |-- questionnaire.html
|   |-- countdown.html
|   |-- blessing-helper.html
|   |-- articles.html
|   |-- invitation.html
|   |-- scripts/
|   `-- styles/
|-- backend/
|   |-- data/
|   |-- database/
|   |-- routes/
|   |-- services/
|   |-- .env.example
|   |-- index.js
|   `-- package.json
|-- docs/
|   |-- api-contracts.md
|   |-- archive/
|   |-- database-schema.md
|   `-- project-notes.md
|-- data/
|   `-- demo-suppliers/
|-- WedWise Protected Site Brief.txt
`-- README.md
```

`frontend/` and `backend/` contain the active application. Frontend pages stay
as separate static entry points, while shared CSS and browser JavaScript are
organized under `frontend/styles/` and `frontend/scripts/`. `docs/archive/`
keeps legacy snapshots out of the active frontend. `data/demo-suppliers/`
contains clearly separated synthetic data assets for development and planned
supplier matching.

## Project Rules

- Read `README.md` and `WedWise Protected Site Brief.txt` at the beginning of
  future development sessions.
- Treat `WedWise Protected Site Brief.txt` as the source of truth for the
  product direction.
- Do not rewrite, reorganize, remove, or otherwise change the protected brief
  unless the user explicitly requests that exact change.
- Keep secrets server-side and out of Git.
- Do not describe demo suppliers as real or verified.
- Update chatbot knowledge with every user-facing change.
- Keep durable implementation notes short in `docs/project-notes.md`.
- Before every GitHub upload, review the repository changes from the current
  session and clean up accidental structural clutter. Remove empty or temporary
  artifact folders, keep frontend/backend naming consistent, update affected
  documentation and paths, and inspect `git status` and `git diff` before
  committing. Do not remove intentional files or folders merely to simplify
  the tree.

## Verification

Before considering a relevant change complete:

```bash
node --check backend/index.js
node --check backend/routes/chat.js
node --check backend/routes/blessing.js
node --check backend/routes/countdown-design.js
node --check backend/routes/image.js
node --check backend/routes/venues.js
node --check backend/services/chat-service.js
node --check frontend/scripts/app.js
node --check frontend/scripts/chat-widget.js
node --check frontend/scripts/blessing-helper.js
node --check frontend/scripts/countdown.js
node --check frontend/scripts/invitation.js
git diff --check
```

For chatbot changes, also run a live relevant-question test and an unrelated
question test when an OpenAI key and network access are available.
