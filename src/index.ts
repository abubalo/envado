import * as dotenv from 'dotenv';
import {
  InvalidEnvVariableError,
  MissingEnvVariableError,
} from './CustomError';

dotenv.config();

type ConfigType = 'number' | 'string' | 'object' | 'array' | 'boolean';

type Config<T extends ConfigType> = {
  type: T;
  defaultValue?: T extends 'number'
    ? number
    : T extends 'string'
    ? string
    : T extends 'object'
    ? object
    : T extends 'array'
    ? T[]
    : T extends 'boolean'
    ? boolean
    : never;
};

type EnvGuardResult<T extends Record<string, Config<any>>> = {
  [K in keyof T]: T[K]['defaultValue'] extends undefined
    ? T[K]['type'] extends 'number'
      ? number
      : T[K]['type'] extends 'string'
      ? string
      : T[K]['type'] extends 'object'
      ? object
      : T[K]['type'] extends 'array'
      ? any[]
      : T[K]['type'] extends 'boolean'
      ? boolean
      : never
    : T[K]['defaultValue'];
};

const loadEnv = (envName: string): string | undefined => {
  return process.env[envName];
};

const validateEnv = <T extends ConfigType>(
  envName: string,
  _type: T,
  defaultValue?: Config<T>['defaultValue'],
  validator?: (value: Config<T>['defaultValue'] | string | number | boolean | object) => boolean,
): Config<T>['defaultValue'] => {
  const rawValue = loadEnv(envName) || defaultValue;

  if (rawValue === undefined) {
    throw new MissingEnvVariableError(envName);
  }

  if (validator && !validator(rawValue)) {
    throw new InvalidEnvVariableError(envName, rawValue.toString());
  }

  return rawValue as Config<T>['defaultValue']; // Explicitly cast to the correct type
};

const envGuard = <T extends Record<string, Config<any>>>(
  config: T,
): EnvGuardResult<T> => {
  const result: any = {} ;

  for (const envName in config) {
    if (config.hasOwnProperty(envName)) {
      const { type, defaultValue } = config[envName];

      switch (type) {
        case 'number':
          result[envName] = validateEnv(envName, type, defaultValue, (value) => {
            const port = parseInt(value as string, 10);
            return !isNaN(port) && port >= 1 && port <= 65535;
          }) ;
          break;

        case 'boolean':
          result[envName] = validateEnv(envName, type, defaultValue, (value) => value === true || value === false);
          break;

        case 'array':
          result[envName] = validateEnv(envName, type, defaultValue, (value) => Array.isArray(value)) as T[];
          break;

        case 'object':
          result[envName] = validateEnv(envName, type, defaultValue, (value) => {
            try {
              JSON.parse(value as string);
              return true;
            } catch (error) {
              return false;
            }
          });
          break;

        case 'string':
          result[envName] = validateEnv(envName, type, defaultValue);
          break;

        default:
          throw new Error(`Unsupported data type: ${type}`);
      }
    }
  }

  return result as EnvGuardResult<T>;
};

export default envGuard;
