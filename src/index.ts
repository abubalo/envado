import * as dotenv from "dotenv";
import {
  InvalidEnvVariableError,
  MissingEnvVariableError,
} from "./CustomError";

dotenv.config();

type AcceptedTypes = "number" | "string" | "object" | "array" | "boolean";

type Config<T extends AcceptedTypes> = {
  type: T;
  defaultValue?: T extends "number"
    ? number
    : T extends "string"
    ? string
    : T extends "object"
    ? object
    : T extends "array"
    ? Array<T>
    : T extends "boolean"
    ? boolean
    : never;
};

// Modify the EnvGuardResult type to accept both boolean and validated value
type EnvGuardResult<T extends Record<string, Config<any>>> = {
  [K in keyof T]: T[K]["defaultValue"] extends undefined
    ? T[K]["type"] extends "number"
      ? number
      : T[K]["type"] extends "string"
      ? string
      : T[K]["type"] extends "object"
      ? object
      : T[K]["type"] extends "array"
      ? any[]
      : T[K]["type"] extends "boolean"
      ? boolean | T[K]["type"] // Change here to accept boolean or validated value
      : never
    : T[K]["defaultValue"];
};

const loadEnv = (envName: string): string | undefined => {
  return process.env[envName];
};

const validateNumber = (value: number | string): number => {
  const parsedValue = typeof value === "string" ? parseInt(value, 10) : value;
  return parsedValue;
};
// Modify the validateBoolean function to return boolean or validated value
const validateBoolean = (value: boolean): boolean | boolean => value;

// Modify the validateArray function to return array or validated value
const validateArray = (
  value: Array<unknown> | string
): Array<unknown> | Array<unknown> => {
  if (Array.isArray(value)) {
    return value;
  } else if (typeof value === "string") {
    // Assuming values are comma-separated
    const valuesArray = value.split(",");
    return valuesArray;
  } else {
    return [];
  }
};

// Modify the validateObject function to return object or validated value
const validateObject = (value: string): object | object => {
  try {
    if (typeof value === "string") {
      return JSON.parse(value);
    }
    return {};
  } catch (error) {
    return {};
  }
};

// Modify the validateEnv function to return the validated value
const validateEnv = <T extends AcceptedTypes>(
  envName: string,
  type: T,
  defaultValue?: Config<T>["defaultValue"],
  validator?: (value: any) => T // Change the return type of the validator to T
): Config<T>["defaultValue"] => {
  const rawValue = loadEnv(envName) ?? defaultValue;

  if (rawValue === undefined) {
    throw new MissingEnvVariableError(
      `No environment variable matches "${envName}" in .env`
    );
  }

  if (validator) {
    const validatedValue = validator(rawValue);
    if (validatedValue === undefined && typeof validatedValue !== type) {
      throw new InvalidEnvVariableError(
        `Invalid default value type for ${envName}. Expected type: ${type}`
      );
    }

    return validatedValue as unknown as Config<T>["defaultValue"];
  }

  return rawValue as Config<T>["defaultValue"];
};

const envGuard = <T extends Record<string, Config<any>>>(
  config: T
): EnvGuardResult<T> => {
  const result: EnvGuardResult<any> = {};

  for (const [envName, { type, defaultValue }] of Object.entries(config)) {
    try {
      if (!["number", "string", "object", "array", "boolean"].includes(type)) {
        throw new Error(`Invalid data type specified for ${envName}: ${type}`);
      }

      switch (type) {
        case "number":
          result[envName] = validateEnv(
            envName,
            type,
            defaultValue,
            validateNumber
          );
          break;

        case "boolean":
          result[envName] = validateEnv(
            envName,
            type,
            defaultValue,
            validateBoolean
          );
          break;

        case "array":
          result[envName] = validateEnv(
            envName,
            type,
            defaultValue,
            validateArray
          );
          break;

        case "object":
          result[envName] = validateEnv(
            envName,
            type,
            defaultValue,
            validateObject
          );
          break;

        case "string":
          result[envName] = validateEnv(envName, type, defaultValue);
          break;

        default:
          throw new Error(`Unsupported data type: ${type}`);
      }
    } catch (error) {
      if (
        error instanceof MissingEnvVariableError ||
        error instanceof InvalidEnvVariableError
      ) {
        throw error;
      }
      // Handles unexpected error
      throw error;
    }
  }

  return result;
};

export default envGuard;
