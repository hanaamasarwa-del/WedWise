# WedWise Backend

Backend-only services belong in this directory. OpenAI API requests must be sent from the backend so credentials are never exposed to browsers.

## OpenAI Configuration

1. Revoke any key that has been shared publicly or in chat.
2. Create a replacement OpenAI project key.
3. Copy `.env.example` to `.env`.
4. Set `OPENAI_API_KEY` in `.env`.

The `.env` file is ignored by Git and must never be committed. In production, configure `OPENAI_API_KEY` using the hosting provider's secret manager.

