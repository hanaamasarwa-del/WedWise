# Project Notes

## Durable Context

- WedWise is a wedding-planning prototype for a course/project presentation.
- The protected brief in `WedWise protected site brief.txt` is the source of truth for the product idea and must not be changed unless explicitly requested.
- The active static site files are `frontend/index.html`, `frontend/styles.css`, and `frontend/script.js`.
- Demo supplier data lives in `backend/database/` and is synthetic only. Do not present it as verified supplier data.

## Planned App Flow

1. Collect wedding preferences with a multi-step questionnaire.
2. Let the couple add free-text style and atmosphere notes.
3. Match the answers against demo supplier data.
4. Generate a personalized report and visual direction with AI.
5. Ask whether the couple wants agency follow-up.
6. Save lead details and send a Telegram notification.

## Implementation Notes

- Keep the project structure simple unless a backend or build step is introduced.
- Keep secrets in `backend/.env`, using `backend/.env.example` as the documented template.
- If real suppliers are added later, store the data source and review date.
