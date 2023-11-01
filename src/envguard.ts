import * as dotenv from "dotenv";
import {
  InvalidEnvVariableError,
  MissingEnvVariableError,
} from "./CustomError";

// Load environment variables from a .env file into process.env
dotenv.config();

// Define a type to filter out undefined values from an object
type FilterUndefinedEnvValues<T> = {
  [P in keyof T]: T[P] extends undefined ? never : T[P];
};

// Create a type to represent the environment variables after filtering out undefined values
type Env = FilterUndefinedEnvValues<typeof process.env>;

/**
 * Load an environment variable without validation.
 * @param envName - The name of the environment variable.
 * @returns The environment variable's value as a string or undefined if not set.
 */
const loadEnv = (envName: string): string | undefined => {
  return process.env[envName];
};

/**
 * Validate and load an environment variable with optional validation.
 * @param envName - The name of the environment variable.
 * @param defaultValue - The default value to use if the environment variable is not set or empty.
 * @param validator - An optional validation function for the environment variable value.
 * @returns The validated and loaded environment variable value.
 * @throws {MissingEnvVariableError} if the environment variable is missing and no default value is provided.
 * @throws {InvalidEnvVariableError} if the environment variable fails validation.
 */
const validateEnvVariable = <T>(
  envName: string,
  defaultValue: T | undefined = undefined,
  validator?: (value: string) => boolean
): T => {
  const value = loadEnv(envName);

  if (value === undefined || value === "") {
    if (defaultValue === undefined) {
      throw new MissingEnvVariableError(envName);
    } else {
      return defaultValue;
    }
  }

  if (validator && !validator(value)) {
    throw new InvalidEnvVariableError(envName, value);
  }

  return value as unknown as T;
};

/**
 * Validate environment variables based on the provided configuration.
 * @param config - The configuration specifying expected environment variables and their types.
 * @returns An object representing the validated environment variables.
 */
type Config = {
  [key: string]:
    | string
    | number
    | boolean
    | string[] // For arrays
    | Record<string, unknown> // For JSON objects
    | undefined;
};

/**
 * Validate a set of environment variables using the specified configuration.
 * @param config - The configuration specifying expected environment variables and their types.
 * @returns An object representing the validated environment variables.
 */
function validateEnv(config: Config): Env {
  const result: Env = {};

  for (const envName in config) {
    if (config.hasOwnProperty(envName)) {
      const type = config[envName];

      if (type === undefined) {
        continue; // Skip undefined variables
      }

      let validate;

      if (typeof type === "number") {
        // Handle numbers
        validate = validateEnvVariable<number>(envName, type, (value) => {
          const port = parseInt(value, 10);
          return !isNaN(port) && port >= 1 && port <= 65535;
        });
      } else if (typeof type === "boolean") {
        // Handle booleans
        validate = validateEnvVariable<boolean>(
          envName,
          type,
          (value) => value === "true" || value === "false"
        );
      } else if (Array.isArray(type)) {
        // Handle arrays
        validate = validateEnvVariable<string[]>(envName, type, (value) =>
          Array.isArray(value.split(","))
        );
      } else if (typeof type === "object") {
        // Handle objects (JSON)
        validate = validateEnvVariable<object>(envName, type, (value) => {
          try {
            JSON.parse(value);
            return true;
          } catch (error) {
            return false;
          }
        });
      } else {
        // Default: treat as string
        validate = validateEnvVariable<string>(envName, type);
      }

      result[envName] = validate;
    }
  }

  return result;
}

// Export the validateEnv function as the default export
export default validateEnv;
