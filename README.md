## PROBLEM7

This folder is a clean replacement app built for Vercel deployment.

What changed from the older project:

- The original folder was left untouched.
- Topic routes use `generateStaticParams`, so each `/test/[chunkId]` page is generated ahead of time.
- The quiz page receives syllabus chunk data from the server component instead of fetching `public/data/...` on the client.
- Fonts use `next/font`.
- The Gemini route runs on the Node.js runtime and reads model config from environment variables.

## Local development

```bash
npm install
npm run dev
```

## Environment variables

Create `.env.local` from `.env.example` and set:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODELS=gemini-3-flash-preview,gemini-3.1-flash-lite-preview,gemini-2.5-flash-lite,gemini-2.5-flash-preview-09-2025,gemini-2.5-flash-lite-preview-09-2025,gemini-2.0-flash,gemini-2.0-flash-lite
```

`GEMINI_MODEL` is optional. The app now defaults to `gemini-2.5-flash` and automatically retries/falls back across multiple free-tier Gemini text models on transient backend failures like `503`.

The bundled fallback chain is:

- `gemini-3-flash-preview`
- `gemini-3.1-flash-lite-preview`
- `gemini-2.5-flash-lite`
- `gemini-2.5-flash-preview-09-2025`
- `gemini-2.5-flash-lite-preview-09-2025`
- `gemini-2.0-flash`
- `gemini-2.0-flash-lite`

The `2.0` models are included only as last-resort compatibility fallbacks and are deprecated upstream.

## Vercel deploy target

Deploy this folder:

`/Users/Work/Desktop/project-7-vercel-rebuild`

In Vercel, add:

- `GEMINI_API_KEY`
- `GEMINI_MODEL` (optional)
- `GEMINI_FALLBACK_MODELS` (optional, comma-separated)

## Verification

Run these before deploy:

```bash
npm run lint
npm run build
```

After deploy:

1. Open the home page.
2. Click a topic from the Topic Map.
3. Confirm the topic page renders immediately without a loading spinner.
4. Start a mock test and confirm the API route returns questions.
