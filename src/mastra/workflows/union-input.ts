import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

// Bug A: a workflow whose input is a union, not an object. Opening it in Studio crashes with
// "Cannot read properties of null (reading 'kind')" before anything is run.
const Signal = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("star"), source: z.string(), repo: z.string() }),
  z.object({ kind: z.literal("visit"), source: z.string(), domain: z.string() }),
]);

const echo = createStep({
  id: "echo",
  inputSchema: Signal,
  outputSchema: z.object({ kind: z.string() }),
  execute: async ({ inputData }) => ({ kind: inputData.kind }),
});

export const unionInput = createWorkflow({
  id: "unionInput",
  inputSchema: Signal,
  outputSchema: z.object({ kind: z.string() }),
})
  .then(echo)
  .commit();
