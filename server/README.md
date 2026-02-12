# n.codes Server

This is the standalone backend service that powers live mode for the n.codes widget.

**Quickstart**
1. Install dependencies:
   `npm install`
2. Create your env file:
   `cp .env.example .env`
3. Add your API key in `.env`:
   Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`.
4. Run the server:
   `npm start`

The server listens on `http://localhost:3001` by default.

**Environment**
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` (required): LLM provider key.
- `PORT` (optional): Defaults to `3001`.
- `APP_ORIGIN` (optional): Comma-separated allowed origins for CORS.
- `MAIN_APP_ORIGIN` (optional): Alternate CORS origin env var.
- `CORS_ORIGIN` (optional): Alternate CORS origin env var.

**Endpoints**
- `POST /api/generate` (batch)
- `POST /api/generate/stream` (SSE stream)
