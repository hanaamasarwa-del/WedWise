# Project Notes

## Durable Context

- WedWise is a wedding-planning prototype for a course/project presentation.
- The protected brief in `WedWise Protected Site Brief.txt` is the source of truth for the product idea and must not be changed unless explicitly requested.
- Active frontend pages live at `frontend/*.html`, shared styles live in `frontend/styles/`, and browser scripts live in `frontend/scripts/`.
- Demo supplier data lives in `data/demo-suppliers/` and is synthetic only. Do not present it as verified supplier data.

## Planned App Flow

1. Collect wedding preferences with a multi-step questionnaire.
2. Let the couple add free-text style and atmosphere notes.
3. Match the answers against demo supplier data.
4. Generate a personalized report and visual direction with AI.
5. Ask whether the couple wants agency follow-up.
6. Save lead details and send a Telegram notification.

## Implementation Notes

- Keep the project structure simple unless a backend or build step is introduced.
- Keep active backend secrets in `backend/.env`, using `backend/.env.example` as the documented template.
- Telegram notifications require backend-only `TELEGRAM_BOT_TOKEN`. Set `TELEGRAM_CHAT_ID` explicitly when the bot has more than one private conversation.
- If real suppliers are added later, store the data source and review date.
- Keep `backend/services/chat-service.js` chatbot knowledge synchronized with every user-facing website change. This review is required before a feature change is complete.
- The landing hero image and floating petal animation are approved brand visuals. Do not replace or remove them without explicit design approval.
- Keep archived legacy frontend snapshots in `docs/archive/` rather than beside active pages.
