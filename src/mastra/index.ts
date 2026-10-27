import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";
import { unionInput } from "./workflows/union-input";
import { nullableStep } from "./workflows/nullable-step";

export const mastra = new Mastra({
  workflows: { unionInput, nullableStep },
  // Runs must be stored for time travel. mastra dev runs from src/mastra/public, so this lands at the project root.
  storage: new LibSQLStore({ id: "repro", url: "file:../../../mastra.db" }),
});
