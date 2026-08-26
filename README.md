# FootyScores QA Endpoint Generator

Web application for QA engineers to generate and review expected football match endpoints for Paris 2024 Olympic Games data.

## Assignment Scope

This app:

- loads football schedule data from the Olympics feed
- filters to football matches only
- generates a deterministic list of endpoint keys per match
- allows visual review by women and men tabs
- allows JSON export for all matches
- supports canceling long exports and retrying failed exports
- lets users inspect mapped match details JSON via modal

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS

## Setup

### Prerequisites

- Node.js 20+
- npm 10+

### Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Production build

```bash
npm run build
npm run start
```

## How Data Is Retrieved and Parsed

1. Client loads schedule list from:
   - `https://stacy.olympics.com/OG2024/data/SCH_StartList~comp=OG2024~disc=FBL~lang=ENG.json`

2. App excludes non-match entries (for example medal ceremony rows) using code filtering.

3. App splits data into women and men tabs using code prefix.

4. Rows are sorted deterministically by kickoff date and time.

5. Details are fetched through internal API endpoint:
   - `/api/match?CODE=<match-code>`

6. Server route calls Olympics details feed and maps source payload to app response format.

## Endpoint Generation

Generated endpoint key format:

```text
/api/match?CODE=<full_schedule_code>
```

Where `<full_schedule_code>` is the full match code from schedule data.

Example:

```text
/api/match?CODE=FBLMTEAM11------------GPB-000100--
```

Each match code maps to one unique endpoint key.

## Deterministic Ordering

Default ordering rule:

1. Sort by parsed `startDate` ascending.
2. If two rows share the same date/time, sort by `code` ascending.
3. Invalid dates are placed after valid dates and still sorted deterministically by code.

This ordering is used for rendering and for export preparation.

## Export Behavior

The app supports:

- `Export all JSON` above tabs (women + men combined)

Export ergonomics for QA workflow:

- `Cancel` button is available while export is running
- `Retry export` button is shown when export fails or is canceled
- each endpoint fetch is retried once before being marked as failed

If all endpoints resolve successfully, output is a plain object:

```json
{
	"/api/match?CODE=<code-1>": { "...": "mapped match data" },
	"/api/match?CODE=<code-2>": { "...": "mapped match data" }
}
```

If some endpoints fail, export still succeeds and includes partial failures:

```json
{
	"matches": {
		"/api/match?CODE=<ok-code>": { "...": "mapped match data" }
	},
	"errors": {
		"/api/match?CODE=<failed-code>": "error message"
	},
	"meta": {
		"total": 52,
		"exported": 51,
		"failed": 1
	}
}
```

## Assumptions and Data Quality Rules

- Upstream schedule and details feeds may contain missing nested fields.
- Missing scorer minute defaults to `0` rather than failing export/mapping.
- Added stoppage time (`45+2`) is intentionally normalized to the base minute (`45`) for numeric consistency.
- If some details endpoints fail, export should still provide successful entries and explicit failure list.
- Status mapping currently treats Olympics `FINISHED` as `FT`; all other states map to `NS`.

## UI States

Implemented states:

- Loading data
- Empty data
- Error loading schedule
- Export pending
- Export canceled
- Export partial/full failure with user-visible message
- Match details modal loading/error/success

## Project Structure

- `app/page.tsx`: main screen and top-level load action
- `components/DataSection/DataSection.tsx`: tabbed layout and global export
- `components/DataSection/Table.tsx`: section table, filters, row actions
- `utils/exportUtils.ts`: deterministic export + download helpers (including cancel/retry support)
- `app/api/match/route.ts`: server proxy and normalization for match details
- `utils/mapper.ts`: source-to-target details mapper

## Acceptance Criteria Mapping

- Accessible UI with trigger to load data: implemented
- Display football matches + generated endpoints: implemented
- Export output as JSON: implemented
- Data source from official Olympics schedule: implemented
- Deterministic output order: implemented and documented
- UX states for loading/empty/error: implemented
- Inspect per-match data: implemented through JSON modal

## Bonus Status

Automated expected-vs-tested JSON comparison is not implemented yet.

## Deployment

This app can be deployed to any Node-capable Next.js host.

Typical options:

- Vercel
- Netlify (Next.js runtime)
- self-hosted Node server
