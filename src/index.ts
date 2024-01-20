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
      ? boolean
      : never
    : T[K]["defaultValue"];
};

const loadEnv = (envName: string): string | undefined => {
  return process.env[envName];
};

const validateEnv = <T extends AcceptedTypes>(
  envName: string,
  type: T,
  defaultValue?: Config<T>["defaultValue"],
  validator?: (value: any) => boolean
): Config<T>["defaultValue"] => {
  const rawValue = defaultValue ?? loadEnv(envName);

  if (rawValue === undefined) {
    throw new MissingEnvVariableError(
      `No environment variable matches "${envName}" in .env`
    );
  }

  // Check if the provided default value matches the specified type
  if (defaultValue !== undefined && typeof defaultValue !== type) {
    throw new InvalidEnvVariableError(
      `Invalid default value type for ${envName}. Expected type: ${type}`
    );
  }

  if (validator && !validator(rawValue)) {
    console.log(validator(rawValue));
    throw new InvalidEnvVariableError(
      `Invalid value for ${envName}. Value: ${rawValue}`
    );
  }

  return rawValue as Config<T>["defaultValue"];
};

const validateNumber = (value: number | string): boolean => {
  const parsedValue = typeof value === "string" ? parseInt(value, 10) : value;
  return !isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= 65535;
};

const validateBoolean = (value: boolean): boolean =>
  value === true || value === false;

const validateArray = (value: Array<unknown> | string): boolean => {
  if (Array.isArray(value)) {
    return true;
  } else if (typeof value === "string") {
    // Assuming values are comma-separated
    const valuesArray = value.split(",");
    return valuesArray.length > 0;
  } else {
    return false;
  }
};

const validateObject = (value: string): boolean => {
  try {
    if (typeof value === "string") {
      JSON.parse(value);
    }
    return true;
  } catch (error) {
    return false;
  }
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
      // Handle unexpected error
      throw error;
    }
  }

  return result;
};

export default envGuard;
