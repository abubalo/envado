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

  validator?: (value: T | undefined) => T;
};

type EnvGuardResult<T extends Record<string, Config<AcceptedTypes>>> = {
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
      ? boolean | T[K]["type"]
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

const validateBoolean = (value: boolean): boolean => value;

const validateArray = (
  value: Array<unknown> | string
): Array<unknown>  => {
  if (Array.isArray(value)) {
    return value;
  } else if (typeof value === "string") {
    const valuesArray = value.split(",");
    return valuesArray;
  } else {
    return [];
  }
};

const validateObject = (value: string): object  => {
  try {
    if (typeof value === "string") {
      return JSON.parse(value);
    }
    return {};
  } catch (error) {
    return {};
  }
};

const validateEnv = <T extends AcceptedTypes>(
  envName: string,
  type: T,
  defaultValue?: Config<T>["defaultValue"],
  validator?: Config<T>["validator"]
): Config<T>["defaultValue"] => {
  const rawValue = loadEnv(envName) ?? defaultValue;

  if (validator) {
    const validatedValue = validator(rawValue as any);
  
    if (type === "array") {
      // Check if the validatedValue is an array
      if (!Array.isArray(validatedValue)) {
        throw new InvalidEnvVariableError(
          `Invalid type for ${envName}. Expected type: ${type} but got ${typeof validatedValue}`
        );
      }
    } else if (typeof validatedValue !== type) {
      throw new InvalidEnvVariableError(
        `Invalid type for ${envName}. Expected type: ${type} but got ${typeof validatedValue}`
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
