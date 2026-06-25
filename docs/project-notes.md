# Project Notes

## Durable Context

- WedWise is a wedding-planning prototype for a course/project presentation.
- The protected brief in `WedWise Protected Site Brief.txt` is the source of truth for the product idea and must not be changed unless explicitly requested.
- The active frontend files are `frontend/index.html`, `frontend/site.css`, and `frontend/app.js`.
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
- Keep active server secrets in `server/.env`, using `server/.env.example` as the documented template.
- Telegram notifications require backend-only `TELEGRAM_BOT_TOKEN`. Set `TELEGRAM_CHAT_ID` explicitly when the bot has more than one private conversation.
- If real suppliers are added later, store the data source and review date.
- Keep `server/services/chat-service.js` chatbot knowledge synchronized with every user-facing website change. This review is required before a feature change is complete.
