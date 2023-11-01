import * as dotenv from "dotenv";
import {
  InvalidEnvVariableError,
  MissingEnvVariableError,
} from "./CustomError";

// Load environment variables from a .env file into process.env
dotenv.config();

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
 * @param validator - An optional validation const for the environment variable value.
 * @returns The validated and loaded environment variable value.
 * @throws {MissingEnvVariableError} if the environment variable is missing and no default value is provided.
 * @throws {InvalidEnvVariableError} if the environment variable fails validation.
 */
const validateEnv = <T>(
  envName: string,
  defaultValue: T | undefined = undefined,
  validator?: (value: string) => boolean
): T => {
  const value = loadEnv(envName);

  if (value === undefined) {
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
type EnvType = {
  [key: string]: string | number | Array<string> | object | boolean;
};

type EnvConfig<T extends EnvType> = {
  [K in keyof T]: T[K];
};

type Config<T> = {
  [K in keyof T]: T[K];
};
/**
 * Validate a set of environment variables using the specified configuration.
 * @param config - The configuration specifying expected environment variables and their types.
 * @returns An object representing the validated environment variables.
 */
const envGuard = <T extends EnvType>(config: Config<T>): EnvConfig<T> => {
  const result: EnvType = {};

  for (const envName in config) {
    if (config.hasOwnProperty(envName)) {
      const type = config[envName];

      if (type === undefined) {
        continue; // Skip undefined variables
      }

      let validate;

      if (typeof type === "number") {
        // Handle numbers
        validate = validateEnv<number>(envName, type, (value) => {
          const port = parseInt(value, 10);
          return !isNaN(port) && port >= 1 && port <= 65535;
        });
      } else if (typeof type === "boolean") {
        // Handle booleans
        validate = validateEnv<boolean>(
          envName,
          type,
          (value) => value === "true" || value === "false"
        );
      } else if (Array.isArray(type)) {
        // Handle arrays
        validate = validateEnv<string[]>(envName, type, (value) =>
          Array.isArray(value.split(","))
        );
      } else if (typeof type === "object") {
        // Handle objects (JSON)
        validate = validateEnv<object>(envName, type, (value) => {
          try {
            JSON.parse(value);
            return true;
          } catch (error) {
            return false;
          }
        });
      } else {
        // Default: treat as string
        validate = validateEnv<string>(envName, type);
      }

      result[envName] = validate;
    }
  }

  return result as EnvConfig<T>;
};

const envConfig = envGuard({
  SECRET_KEY: "string",
  API_KEY: "string",
  ENABLE_FEATURE: "boolean",
  DEBUG_MODE: "boolean",
  CONFIG_JSON: "json",
  TAGS: "array",
  PORT: "number",
});

console.log("SECRET_KEY:", envConfig.SECRET_KEY);
console.log("API_KEY:", envConfig.API_KEY);
console.log("PORT:", envConfig.PORT);
console.log("PORT datatype:", typeof envConfig.PORT);
// Export the envGuard const as the default export
export default envGuard;
