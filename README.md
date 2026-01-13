# Live Polling

A realtime poll app for meetups. Hosts can open a slider or multiple-choice poll from `/admin`, attendees vote anonymously, and everyone sees live aggregates plus a history of closed polls.

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
- Projector results: `http://localhost:3000/results`

## Prewritten poll presets

Create or edit `data/prewritten-polls.json` to define polls ahead of time. The admin page loads these presets in a sidebar; click a preset to populate the form before opening a poll.

Example:

```
[
  {
    "id": "energy-check",
    "type": "slider",
    "question": "How energized is the room right now?"
  },
  {
    "id": "next-topic",
    "type": "multiple_choice",
    "question": "Which topic should we cover next?",
    "options": ["APIs", "Testing", "Infra"]
  }
]
```

## Aggregation test

```
npm run test:agg
```

## Unit tests

```
npm test
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

4) Open a poll from the admin console (try both slider and multiple choice).

5) For slider polls, move sliders in each attendee tab and confirm:
- the count increases to the number of distinct anon IDs
- the average changes as expected
- the histogram bars update

6) For multiple-choice polls, select options in each attendee tab and confirm:
- the count increases to the number of distinct anon IDs
- the option counts change as expected

7) Close the poll and confirm:
- attendee pages show “Waiting for the next poll”
- the closed poll summary appears in history

8) Use “Clear all polls” to remove the active poll and history.

9) Open a new poll and confirm voting resets for the new poll.

Expected example:
If two attendees set values to 0 and 10, count is 2, avg is 5.0, histogram[0]=1 and histogram[10]=1.
If two attendees pick option A and one picks option B, counts are A=2 and B=1.

## Vercel deployment notes

- Set `ADMIN_KEY`, `KV_REST_API_URL`, and `KV_REST_API_TOKEN` in the Vercel project environment variables.
- The app uses `@vercel/kv` for persistence; no filesystem writes are used for poll state.
- Admin routes validate `ADMIN_KEY` server-side before opening or closing a poll.
