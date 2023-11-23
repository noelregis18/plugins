/**
 * @Amplication example constants file.
 * Add all your constants here.
 */

import { VariableDictionary } from "@amplication/code-gen-types";
import { join } from "path";

export const envVariables: VariableDictionary = [
  { SERVER_URL: "http://localhost:3000" },
];

export const adminUIPackageJsonValues = {
  dependencies: {
    "@auth0/auth0-spa-js": "^2.1.2",
    "react-router-dom": "^5.3.3",
    history: "4.10.1",
  },
  devDependencies: {
    "@types/react-router-dom": "5.3.2",
    "@types/history": "^4.7.11",
  },
};

export const serverPackageJsonValues = {
  dependencies: {
    "graphql-upload": "^13.0.0",
  },
  devDependencies: {
    "@types/graphql-upload": "^8.0.12",
    "@types/multer": "^1.4.8",
  },
};

export const staticsPath = join(__dirname, "static");
export const templatesPath = join(__dirname, "templates");

export const generateInvalidFileFieldError = (
  entityName: string,
  fieldName: string,
) =>
  `DataType of field: ${fieldName} should be JSON on entity: ${entityName}. As you've prefixed it with "file..." it should be a JSON field to store the file metadata else you can use any other prefix.`;
