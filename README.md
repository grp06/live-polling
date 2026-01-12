# Live Polling

A realtime slider poll app for meetups. Hosts can open one poll at a time from `/admin`, attendees vote anonymously on a 0–10 slider, and everyone sees live aggregates plus a history of closed polls.

## Setup

Create `.env.local` with your values:

```
ADMIN_KEY=your-long-random-string
KV_REST_API_URL=your-vercel-kv-url
KV_REST_API_TOKEN=your-vercel-kv-token
```

Install dependencies:

```
npm install
```

## Run locally

```
npm run dev
```

Visit:
- Attendee view: `http://localhost:3000/`
- Admin view: `http://localhost:3000/admin?key=YOUR_ADMIN_KEY`

## Aggregation test

```
npm run test:agg
```

## Manual validation (end-to-end)

1) Start the dev server:

```
npm run dev
```

2) Open the admin page:

```
http://localhost:3000/admin?key=YOUR_ADMIN_KEY
```

3) Open attendee pages in multiple tabs:

```
http://localhost:3000/
```

4) Open a poll from the admin console.

5) Move sliders in each attendee tab and confirm:
- the count increases to the number of distinct anon IDs
- the average changes as expected
- the histogram bars update

6) Close the poll and confirm:
- attendee pages show “Waiting for the next poll”
- the closed poll summary appears in history

7) Open a new poll and confirm voting resets for the new poll.

Expected example:
If two attendees set values to 0 and 10, count is 2, avg is 5.0, histogram[0]=1 and histogram[10]=1.

## Vercel deployment notes

- Set `ADMIN_KEY`, `KV_REST_API_URL`, and `KV_REST_API_TOKEN` in the Vercel project environment variables.
- The app uses `@vercel/kv` for persistence; no filesystem writes are used for poll state.
- Admin routes validate `ADMIN_KEY` server-side before opening or closing a poll.
