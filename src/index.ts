import * as dotenv from "dotenv";
import {
  InvalidEnvVariableError,
  MissingEnvVariableError,
} from "./CustomError";

// Load environment variables from a .env file into process.env
dotenv.config();

/**
 * Loads an environment variable's value.
 *
 * @param {string} envName - The name of the environment variable.
 * @returns {string | undefined} The value of the environment variable or undefined if not found.
 */
const loadEnv = (envName: string): string | undefined => {
  return process.env[envName];
};

/**
 * Represents the possible types for environment variables.
 */
type ConfigType = "number" | "string" | "object" | "array" | "boolean";

/**
 * Configuration object for environment variables.
 */
type Config<T> = {
  type: ConfigType; // The expected data type of the environment variable.
  defaultValue?: string | number | boolean | object | string[]; // An optional default value if the variable is not set.
};

/**
 * Represents the result of environment variable validation.
 */
type EnvGuardResult = {
  [envName: string]: string | number | boolean | object | string[] | undefined;
};

/**
 * Validates and loads an environment variable.
 *
 * @param {string} envName - The name of the environment variable.
 * @param {ConfigType} _type - The expected data type of the environment variable.
 * @param {T} defaultValue - An optional default value if the variable is not set.
 * @param {(value: T | string) => boolean} validator - An optional validation function.
 * @returns {T | string} The validated environment variable value.
 * @throws {MissingEnvVariableError} if the variable is not set and no default value is provided.
 * @throws {InvalidEnvVariableError} if the variable value is invalid based on the provided validator function.
 */
const validateEnv = <T>(
  envName: string,
  _type: ConfigType,
  defaultValue?: T,
  validator?: (value: T | string) => boolean
): T | string => {
  const rawValue = loadEnv(envName) || defaultValue;

  if (rawValue === undefined) {
    throw new MissingEnvVariableError(envName);
  }

  if (validator && !validator(rawValue)) {
    throw new InvalidEnvVariableError(envName, rawValue as string);
  }

  return rawValue;
};

/**
 * Guards and validates a set of environment variables based on a provided configuration.
 *
 * @param {Record<string, Config<EnvGuardResult>>} config - The configuration for environment variables.
 * @returns {EnvGuardResult} An object containing the validated environment variables.
 */
const envGuard = (config: Record<string, Config<EnvGuardResult>>): EnvGuardResult => {
  const result: EnvGuardResult = {};

  for (const envName in config) {
    if (config.hasOwnProperty(envName)) {
      const { type, defaultValue } = config[envName];

      switch (type) {
        case "number":
          result[envName] = validateEnv(
            envName,
            type,
            defaultValue,
            (value) => {
              const port = parseInt(value.toString(), 10);
              return !isNaN(port) && port >= 1 && port <= 65535;
            }
          );
          break;

        case "boolean":
          result[envName] = validateEnv(
            envName,
            type,
            defaultValue,
            (value) => value === true || value === false
          );
          break;

        case "array":
          result[envName] = validateEnv(envName, type, defaultValue, (value) =>
            Array.isArray(value)
          );
          break;

        case "object":
          result[envName] = validateEnv(
            envName,
            type,
            defaultValue,
            (value) => {
              try {
                JSON.parse(value.toString());
                return true;
              } catch (error) {
                return false;
              }
            }
          );
          break;

        case "string":
          result[envName] = validateEnv(envName, type, defaultValue);
          break;

        default:
          throw new Error(`Unsupported data type: ${type}`);
      }
    }
  }

  return result;
};

export default envGuard;
