# Mastra Studio crashes on union inputs and on time travel with `null` step inputs

## What this repo shows

We use Mastra Studio to run our workflows by hand and to "time travel": re-run a single step with
the input it got in an earlier run. Our schemas are ordinary zod:

- Some workflows accept one of several input shapes (a `z.discriminatedUnion`).
- Some steps receive objects that can be empty (`z.object({...}).nullable()`), and in real runs
  they often are `null`.

On `mastra@1.35.0` / `@mastra/core@1.79.0`, Studio crashes in both cases, so we can't use it on
those workflows. This repo has the smallest setup we could find that shows each crash. The same
code is still in `mastra@1.36.0-alpha.4`.

## Why it happens

Studio's form fills in starting values by walking down into the data, key by key. It stops when a
value is missing (`undefined`) but not when it's `null`, so it tries to read a field of `null` and
the page crashes:

```js
function get(obj, path) { let n = obj; for (const k of path) if ((n = n[k]) === undefined) return; return n }
```

## Setup

```bash
pnpm install
pnpm dev
```

Studio runs at http://localhost:4111.

## Crash 1: a workflow whose input can take several shapes won't open

Open http://localhost:4111/workflows/unionInput/graph.

> Unable to display this workflow. Cannot read properties of null (reading 'kind')

`unionInput` takes either a "star" or a "visit" (see `src/mastra/workflows/union-input.ts`).
Because the input isn't a single object, Studio puts it in a wrapper field. It fills that field
with the last run's input, which is `null` when no run has been picked. The form then reads `kind`
from `null`.

## Crash 2: re-running a step fails when its saved input has a `null` object

1. Run the workflow once. The `describe` step gets `{ id: "lead-1", company: null }`:

   ```bash
   curl -s -XPOST localhost:4111/api/workflows/nullableStep/start-async -H 'content-type: application/json' -d '{"inputData":{"id":"lead-1"}}'
   ```

2. In Studio, go to Workflows → nullableStep → open that run.
3. On the `describe` step, open the ⋮ menu and pick **Time travel**.

> Graph unavailable. Cannot read properties of null (reading 'name')

`company` is allowed to be `null` (see `src/mastra/workflows/nullable-step.ts`). Studio fills the
form with the saved input and tries to read `company.name`.

## Suggested fixes

- Stop the walk on `null` as well as on `undefined` (`n == null`). This alone fixes both crashes.
- Don't fill the wrapper field when the saved input is `null` (`r == null ? undefined : {"​": r}`).
