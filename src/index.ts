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

    validator?: (value: any) => boolean
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
  validator?: Config<T>["validator"]
): Config<T>["defaultValue"] => {
  const rawValue = defaultValue ?? loadEnv(envName);

  if (rawValue === undefined) {
    throw new MissingEnvVariableError(
      `No environment variable matches "${envName}" in .env`
    );
  }

  if (typeof rawValue !== type) {
    throw new InvalidEnvVariableError(
      `Expected type ${type}, but got ${typeof rawValue}`
    );
  }

  const typedValue = rawValue as Config<T>["defaultValue"];

  if (validator && !validator(typedValue)) {
    throw new InvalidEnvVariableError(
      `Environment variable "${envName}" is invalid`
    );
  }

  return rawValue as Config<T>["defaultValue"];
};

const envGuard = <T extends Record<string, Config<any>>>(
  config: T
): EnvGuardResult<T> => {
  const result: any = {};

  for (const [envName, { type, defaultValue }] of Object.entries(config)) {
    switch (type) {
      case "number":
        result[envName] = validateEnv(
          envName,
          type,
          defaultValue,
          (value: number | string) => {
            const parsedValue =
              typeof value === "string" ? parseInt(value, 10) : value;
            return (
              !isNaN(parsedValue) && parsedValue >= 1 && parsedValue <= 65535
            );
          }
        );
        break;

      case "boolean":
        result[envName] = validateEnv(
          envName,
          type,
          defaultValue,
          (value: boolean) => value === true || value === false
        );
        break;

      case "array":
        result[envName] = validateEnv(
          envName,
          type,
          defaultValue,
          (value: Array<unknown>) => Array.isArray(value)
        );
        break;

      case "object":
        result[envName] = validateEnv(
          envName,
          type,
          defaultValue,
          (value: string) => {
            try {
              JSON.parse(value);
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

  return result as EnvGuardResult<T>;
};

export default envGuard;
