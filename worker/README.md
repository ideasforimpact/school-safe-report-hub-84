# Monthly Compliance Report Worker (Inngest)

This worker runs **outside** Supabase Edge so it can load **all** client data (500–10K+ rows) and generate full PDF reports without timeout or memory limits.

## Architecture

- **Cron / Orchestrator** (Supabase): Enqueues one row per client in `monthly_export_queue`.
- **Consumer** (Supabase Edge): Reads queue, sends `monthly-report/generate` event to **Inngest** (no heavy work in Edge).
- **This worker** (Inngest): Receives event, fetches all data from Supabase, generates PDF, uploads to Storage, calls `monthly_export_queue_complete` or `monthly_export_queue_fail`.

## Prerequisites

- Node.js 18+
- [Inngest](https://www.inngest.com) account (free tier works)
- Supabase project (URL + service role key)

## Setup

### 1. Install dependencies

```bash
cd worker
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and set:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (Dashboard → Project Settings → API) |
| `INNGEST_SIGNING_KEY` | From Inngest Dashboard → Keys (used by Inngest to call your app) |

For **sending events** from the Supabase Consumer to Inngest, add in **Supabase Edge secrets**:

| Secret | Description |
|--------|-------------|
| `INNGEST_EVENT_KEY` | From Inngest Dashboard → Keys (Event Key); used by the consumer to POST events |

### 3. Run locally

```bash
# Terminal 1: run the worker
npm run dev

# Terminal 2: run Inngest Dev Server (so it can discover and run your function)
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

Open http://localhost:8288 for the Inngest Dev UI.

### 4. Deploy the worker

Deploy this app to a host that can reach the internet (and that Inngest Cloud can call):

- **Vercel**: Add `worker` as root or subdirectory, set build command and output dir for the worker.
- **Railway / Render / Fly.io**: Deploy this directory as a Node app; set `PORT` and the env vars above. Set the public URL in Inngest Dashboard as the sync URL (e.g. `https://your-app.railway.app/api/inngest`).

After deploy, in **Inngest Dashboard**:

1. Add your app (sync URL = `https://<your-worker-host>/api/inngest`).
2. Use the **Signing Key** as `INNGEST_SIGNING_KEY` in the worker env.
3. Use the **Event Key** as `INNGEST_EVENT_KEY` in Supabase Edge secrets so the consumer can send events.

## Behaviour

- **No row cap**: Fetches up to 10,000 rows per table per client (configurable in `src/report/fetchers.ts`).
- **Same PDF design**: Uses the same React-PDF layout and sections as the original report (Executive Summary, Vehicle, Employee, Assessment, Incident, Grievance).
- **Complete/fail**: On success, calls `monthly_export_queue_complete` with path and email details; on failure, calls `monthly_export_queue_fail` and Inngest retries according to the function config (e.g. 2 retries).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run worker with tsx watch |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled `dist/index.js` |
| `npm run inngest:dev` | Start Inngest Dev Server pointing at local worker |
