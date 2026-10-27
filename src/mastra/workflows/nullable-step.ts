import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

// Bug B: a step whose input has a nullable object that was null in a real run. Time travel to
// "describe" crashes with "Cannot read properties of null (reading 'name')".
const Lead = z.object({
  id: z.string(),
  company: z.object({ name: z.string(), domain: z.string() }).nullable(),
});

const load = createStep({
  id: "load",
  inputSchema: z.object({ id: z.string() }),
  outputSchema: Lead,
  execute: async ({ inputData }) => ({ id: inputData.id, company: null }),
});

const describe = createStep({
  id: "describe",
  inputSchema: Lead,
  outputSchema: z.object({ text: z.string() }),
  execute: async ({ inputData }) => ({ text: inputData.company ? inputData.company.name : "unknown company" }),
});

export const nullableStep = createWorkflow({
  id: "nullableStep",
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({ text: z.string() }),
})
  .then(load)
  .then(describe)
  .commit();
