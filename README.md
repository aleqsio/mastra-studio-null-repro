# Mastra Studio: null crashes in the AutoForm

Minimal repro for two Studio crashes with plain zod schemas on `mastra@1.35.0` / `@mastra/core@1.79.0`
(the same code is in `mastra@1.36.0-alpha.4`). Both come from the form's default-value path walk,
which stops on `undefined` but not on `null`:

```js
function get(obj, path) { let n = obj; for (const k of path) if ((n = n[k]) === undefined) return; return n }
```

## Setup

```bash
pnpm install
pnpm dev
```

Studio runs at http://localhost:4111.

## A. A workflow whose input is a union cannot be opened

Open http://localhost:4111/workflows/unionInput/graph.

> Unable to display this workflow. Cannot read properties of null (reading 'kind')

`unionInput`'s `inputSchema` is a `z.discriminatedUnion` (see `src/mastra/workflows/union-input.ts`).
Studio wraps a root schema with no object shape as `{"​": schema}` and seeds that key with the
run payload, which is `null` before any run is picked (`r === undefined ? undefined : {"​": r}`).
The union's fields are then looked up under a `null` parent.

## B. Time travel crashes when the step's stored input has a null object

Seed one run, whose `describe` step receives `{ id: "lead-1", company: null }`:

```bash
curl -s -XPOST localhost:4111/api/workflows/nullableStep/start-async -H 'content-type: application/json' -d '{"inputData":{"id":"lead-1"}}'
```

Open the run in Studio (Workflows → nullableStep → the run), open the `describe` step's menu
(⋮) and pick **Time travel**.

> Graph unavailable. Cannot read properties of null (reading 'name')

`company` is `z.object({...}).nullable()` (see `src/mastra/workflows/nullable-step.ts`). The form
prefills from the stored payload and walks into `company.name`.

## Suggested fixes

- Stop the path walk on `null` as well as `undefined` (`n == null`). This alone stops both crashes.
- Skip the root wrapper's default when the payload is `null` (`r == null ? undefined : {"​": r}`).
