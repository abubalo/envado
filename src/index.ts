import * as dotenv from "dotenv";
import {
  InvalidEnvVariableError,
  MissingEnvVariableError,
} from "./CustomError";

dotenv.config();

type AcceptedTypes = "number" | "string" | "object" | "array" | "boolean";

type Config<T> = {
  type: T;
  defaultValue?: T extends number | string | Array<unknown> | object
    ? T
    : never;
};

type EnvShieldResult<T extends Record<string, Config<AcceptedTypes>>> = {
  [K in keyof T]: T[K]["defaultValue"] extends undefined
    ? T[K]["type"] extends "number"
      ? number
      : T[K]["type"] extends "string"
      ? string
      : T[K]["type"] extends "object"
      ? object
      : T[K]["type"] extends "array"
      ? unknown[]
      : T[K]["type"] extends "boolean"
      ? boolean | T[K]["type"]
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
  validator?: (value: T | string | undefined) => T
): T => {
  const rawValue = loadEnv(envName) ?? defaultValue;
  let validatedValue = rawValue;

  if (rawValue === undefined) {
    throw new MissingEnvVariableError(
      `No environment variable matches "${envName}" in .env`
    );
  }


  if (validator) {
    validatedValue = validator(rawValue);
  }

  if (typeof validatedValue !== type && type !== "array") {
    throw new InvalidEnvVariableError(
      `Invalid typesss for '${envName}'. Expected type: ${type} but got ${typeof validatedValue}`
    );
  } else if (type === "array" && !Array.isArray(validatedValue)) {
    throw new InvalidEnvVariableError(
      `Invalid type for '${envName}'. Expected type: ${type} but got ${typeof validatedValue}`
    );
  }

  return validatedValue as T;
};



const validateNumber = (value: number | string): number => {
  const parsedValue = typeof value === "string" ? parseInt(value, 10) : value;
  return parsedValue;
};

const validateBoolean = (value: boolean | string): boolean => Boolean(value);

const validateArray = (value: Array<unknown> | string): Array<unknown> => {
  if (Array.isArray(value)) {
    return value;
  } else if (typeof value === "string") {
    const valuesArray = value.split(",");
    return valuesArray;
  } else {
    return [];
  }
};

const validateObject = (value: string): object => {
  try {
    if (typeof value === "string") {
      return JSON.parse(value);
    }
    return {};
  } catch (error) {
    return {};
  }
};

const envShield = <T extends Record<string, Config<any>>>(
  config: T
): EnvShieldResult<T> => {
  const result: EnvShieldResult<any> = {};

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

export default envShield;
