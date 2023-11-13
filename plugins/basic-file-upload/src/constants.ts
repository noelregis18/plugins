/**
 * @Amplication example constants file.
 * Add all your constants here.
 */

import { VariableDictionary } from "@amplication/code-gen-types";
import { join } from "path";

export const envVariables: VariableDictionary = [
  { SERVER_URL: "http://localhost:3000" },
];

export const staticsPath = join(__dirname, "static");
export const templatesPath = join(__dirname, "templates");
