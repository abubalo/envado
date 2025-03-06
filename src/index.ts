import { config } from "dotenv";
import {
  InvalidEnvVariableError,
  MissingEnvVariableError,
  SchemaError,
  TransformationError,
  ValidationError,
} from "./errors";
import {
  InferSchemaType,
  SchemaDefinition,
  ValidationResult,
  Validator,
  Transformer,
  ExtendedEnvSchema,
} from "./types";

// Determine if we're in a browser environment
const isBrowser =
  typeof window !== "undefined" && typeof process === "undefined";

// Get environment variables based on environment
const getDefaultEnvVars = (): Record<string, string | undefined> => {
  if (isBrowser) {
    // For Vite in browser environments
    if (typeof import.meta !== "undefined" && import.meta.env) {
      return import.meta.env;
    }
    // Fallback to empty object in browser
    return {};
  } else {
    // Node.js environment
    return process.env;
  }
};

// The rest of your existing code remains the same until validateEnv...

const string = (options?: { default?: string }) => {
  const initialSchema: SchemaDefinition<string> = {
    type: "string",
    validators: [
      (value): ValidationResult =>
        typeof value?.trim() !== "string"
          ? `Expected string, but got ${typeof value}`
          : undefined,
    ],
    asyncValidators: [],
    transformers: [],
    optional: false,
    default: options?.default,
  };

  return {
    ...createSchemaBuilder(initialSchema).schema,

    oneOf: <T extends string>(values: readonly T[]) => {
      const newValidator: Validator<string> = (value) =>
        values.includes(value as T)
          ? undefined
          : `Value must be one of: ${values.join(", ")}`;

      return createSchemaBuilder({
        ...initialSchema,
        validators: [...initialSchema.validators, newValidator],
      }).schema;
    },

    url: () => {
      const newValidator: Validator<string> = (value) => {
        try {
          new URL(value);
          return undefined;
        } catch {
          return "Invalid URL";
        }
      };

      return createSchemaBuilder({
        ...initialSchema,
        validators: [...initialSchema.validators, newValidator],
      }).schema;
    },

    min: (length: number) => {
      const newValidator: Validator<string> = (value) =>
        typeof value === "string" && value.length < length
          ? `String must be at least ${length} characters long`
          : undefined;

      return createSchemaBuilder({
        ...initialSchema,
        validators: [...initialSchema.validators, newValidator],
      }).schema;
    },

    max: (length: number) => {
      const newValidator: Validator<string> = (value) =>
        typeof value === "string" && value.length > length
          ? `String must not exceed ${length} characters`
          : undefined;

      return createSchemaBuilder({
        ...initialSchema,
        validators: [...initialSchema.validators, newValidator],
      }).schema;
    },
    email: () => {
      const newValidator: Validator<string> = (value) => {
        const trimmedEmail = value.trim();

        const emailPattern =
          /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

        if (!emailPattern.test(trimmedEmail)) {
          return "Invalid email format";
        }

        return undefined;
      };

      return createSchemaBuilder({
        ...initialSchema,
        validators: [...initialSchema.validators, newValidator],
        transformers: [
          ...initialSchema.transformers,
          (value: string) => value.trim(),
        ],
      });
    },
  };
};

const number = (options?: { default?: number }) => {
  const initialSchema: SchemaDefinition<number> = {
    type: "number",
    validators: [
      (value): ValidationResult => {
        const num = typeof value === "string" ? Number(value) : value;
        return typeof num !== "number" || isNaN(num)
          ? `Expected number, but got ${typeof value}`
          : undefined;
      },
    ],
    asyncValidators: [],
    transformers: [
      (value) => (typeof value === "string" ? Number(value) : value),
    ],
    optional: false,
    default: options?.default,
  };

  return {
    ...createSchemaBuilder(initialSchema).schema,

    min: (min: number) => {
      const newValidator: Validator<number> = (value) =>
        value < min
          ? `Value must be greater than or equal to ${min}`
          : undefined;

      return createSchemaBuilder({
        ...initialSchema,
        validators: [...initialSchema.validators, newValidator],
      }).schema;
    },

    max: (max: number) => {
      const newValidator: Validator<number> = (value) =>
        value > max ? `Value must be less than or equal to ${max}` : undefined;

      return createSchemaBuilder({
        ...initialSchema,
        validators: [...initialSchema.validators, newValidator],
      });
    },

    port: () => {
      return createSchemaBuilder({
        ...initialSchema,
        validators: [
          ...initialSchema.validators,
          (value) =>
            value < 1 || value > 65535 ? "Invalid port number" : undefined,
        ],
      }).schema;
    },
  };
};

const boolean = (options?: { default?: boolean }) => {
  const booleanTransformer = (value: string | boolean): boolean => {
    if (typeof value === "boolean") return value;
    const normalized = value.toLowerCase().trim();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
    throw new InvalidEnvVariableError("", `Invalid boolean value: ${value}`);
  };

  const initialSchema: SchemaDefinition<boolean> = {
    type: "boolean",
    validators: [
      (value): ValidationResult => {
        try {
          booleanTransformer(value);
          return undefined;
        } catch {
          return `Expected boolean, but got ${value}`;
        }
      },
    ],
    asyncValidators: [],
    transformers: [booleanTransformer],
    optional: false,
    default: options?.default,
  };

  return createSchemaBuilder(initialSchema).schema;
};

const array = <T>(options?: {
  default?: Array<T>;
  separator?: string;
  trim?: boolean;
}) => {
  const separator = options?.separator ?? ",";
  const shouldTrim = options?.trim ?? true;

  const stringToArray = (value: string): string[] => {
    const items = value.split(separator);
    return shouldTrim ? items.map((item) => item.trim()) : items;
  };

  const initialSchema: SchemaDefinition<T[]> = {
    type: "array",
    validators: [
      (value): ValidationResult => {
        // If it's already an array, no validation needed
        if (Array.isArray(value)) {
          return undefined;
        }

        // If it's a string, we'll convert it later in the transformers
        if (typeof value === "string") {
          return undefined;
        }

        return `Expected array or comma-separated string, but got ${typeof value}`;
      },
    ],
    asyncValidators: [],
    transformers: [
      (value) => {
        // If already an array, return as is
        if (Array.isArray(value)) {
          return value;
        }

        // If string, convert to array
        if (typeof value === "string") {
          return stringToArray(value);
        }

        // For other types, try to handle them appropriately
        // This could be extended based on requirements
        return value;
      },
    ],
    optional: false,
    default: options?.default,
  };

  return {
    ...createSchemaBuilder(initialSchema).schema,

    items: (itemSchema: SchemaDefinition<T>) => {
      const validateItems: Validator<T[]> = (values) => {
        for (const value of values) {
          for (const validator of itemSchema.validators) {
            const result = validator(value);
            if (result) return result;
          }
        }
      };

      return createSchemaBuilder({
        ...initialSchema,
        validators: [...initialSchema.validators, validateItems],
      }).schema;
    },

    min: (min: number) => {
      const newValidator: Validator<T[]> = (value) =>
        value.length < min
          ? `Array must contain at least ${min} items`
          : undefined;

      return createSchemaBuilder({
        ...initialSchema,
        validators: [...initialSchema.validators, newValidator],
      }).schema;
    },

    max: (max: number) => {
      const newValidator: Validator<T[]> = (value) =>
        value.length > max
          ? `Array must contain at most ${max} items`
          : undefined;

      return createSchemaBuilder({
        ...initialSchema,
        validators: [...initialSchema.validators, newValidator],
      }).schema;
    },

    // We keep this for backward compatibility,
    // but it's no longer necessary as parsing happens automatically
    commaSeparated: (options?: { separator?: string; trim?: boolean }) =>
      createSchemaBuilder({
        ...initialSchema,
        transformers: [
          ...initialSchema.transformers,
          (value: any) => {
            if (typeof value === "string") {
              const sep = options?.separator ?? separator;
              const doTrim = options?.trim ?? shouldTrim;

              const parts = value.split(sep);
              return doTrim ? parts.map((item) => item.trim()) : parts;
            }
            return value;
          },
        ],
      }).schema,

    // Add a method to specify a custom separator
    withSeparator: (customSeparator: string, shouldTrimItems: boolean = true) =>
      createSchemaBuilder({
        ...initialSchema,
        transformers: [
          (value: any) => {
            if (typeof value === "string") {
              const parts = value.split(customSeparator);
              return shouldTrimItems ? parts.map((item) => item.trim()) : parts;
            }
            return Array.isArray(value) ? value : [value];
          },
        ],
      }).schema,
  };
};

const object = <T extends Record<string, SchemaDefinition<any>>>(
  schema: T,
  options?: { default?: InferSchemaType<T> }
) => {
  type ObjectType = { [K in keyof T]: InferSchemaType<{ key: T[K] }>["key"] };

  const initialSchema: SchemaDefinition<ObjectType> = {
    type: "object",
    validators: [
      (value): ValidationResult => {
        if (typeof value !== "object" || value === null) {
          return `Expected object, got ${typeof value}`;
        }
      },
    ],
    asyncValidators: [],
    transformers: [],
    optional: false,
    default: options?.default,
  };

  return {
    ...createSchemaBuilder(initialSchema).schema,

    strict: () => {
      const validateKeys: Validator<ObjectType> = (value) => {
        const extraKeys = Object.keys(value).filter((key) => !(key in schema));
        if (extraKeys.length > 0) {
          return `Unexpected keys: ${extraKeys.join(", ")}`;
        }
      };

      return createSchemaBuilder({
        ...initialSchema,
        validators: [...initialSchema.validators, validateKeys],
      }).schema;
    },
  };
};

const createSchemaBuilder = <T>(schema: SchemaDefinition<T>) => ({
  optional: () =>
    createSchemaBuilder({
      ...schema,
      optional: true,
    }),

  custom: (validator: Validator<T>) =>
    createSchemaBuilder({
      ...schema,
      validators: [...schema.validators, validator],
    }),

  transform: <U>(transformer: Transformer<T, U>) =>
    createSchemaBuilder({
      ...schema,
      transformers: [...schema.transformers, transformer],
    }),

  schema: schema,
});

const validateValue = <T>(
  schema: SchemaDefinition<T>,
  value: unknown,
  variableName: string
): { value: T; errors: string[] } => {
  const errors: string[] = [];
  let currentValue: any = value;

  // Use default value if the environment variable is missing or undefined
  if (value === undefined && schema.default !== undefined) {
    currentValue = schema.default;
  }

  if (currentValue === undefined) {
    if (schema.optional) {
      return { value: undefined as any, errors: [] };
    } else {
      throw new MissingEnvVariableError(variableName);
    }
  }

  try {
    currentValue = schema.transformers.reduce(
      (val, transformer) => transformer(val),
      currentValue
    );
  } catch (error) {
    throw new TransformationError(
      variableName,
      error instanceof Error ? error.message : String(error)
    );
  }

  schema.validators.forEach((validator) => {
    const result = validator(currentValue);
    if (result) errors.push(result);
  });

  if (errors.length > 0) {
    throw new ValidationError(variableName, errors.join(", "));
  }

  return { value: currentValue, errors };
};

export const createEnvSchema = <
  T extends Record<string, SchemaDefinition<any>>,
>(
  schemaFn: (builder: {
    string: typeof string;
    number: typeof number;
    boolean: typeof boolean;
    array: typeof array;
    object: typeof object;
  }) => T
) => {
  const builder = { string, number, boolean, array, object };
  const schema = schemaFn(builder);

  return {
    schema,
    parse: (env: Record<string, string | undefined> = getDefaultEnvVars()) => {
      const results = Object.entries(schema).map(([key, schema]) => {
        try {
          // For Vite, check both the original key and with VITE_ prefix
          const viteKey = `VITE_${key}`;
          const value = key in env ? env[key] : env[viteKey];

          const result = validateValue(schema, value, key);
          return { key, ...result };
        } catch (error) {
          if (
            error instanceof MissingEnvVariableError ||
            error instanceof TransformationError ||
            error instanceof ValidationError
          ) {
            throw error; // Re-throw custom errors
          } else {
            throw new SchemaError(
              `Unexpected error while validating ${key}: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        }
      });

      const errors = results
        .filter((result) => result.errors.length > 0)
        .map(({ key, errors }) => errors.map((error) => `${key}: ${error}`))
        .flat();

      if (errors.length > 0) {
        throw new SchemaError(
          `Environment validation failed:\n${errors.join("\n")}`
        );
      }

      return results.reduce(
        (acc, { key, value }) => ({
          ...acc,
          [key]: value,
        }),
        {}
      ) as {
        [K in keyof T]: T[K] extends SchemaDefinition<infer U> ? U : never;
      };
    },
  };
};

const addEnvDerivedProperties = <T extends Record<string, any>>(
  parsedEnv: T
) => {
  const NODE_ENV =
    parsedEnv.NODE_ENV ||
    (isBrowser && import.meta?.env?.MODE) ||
    "development";

  return {
    ...parsedEnv,
    isDev: NODE_ENV === "development",
    isDevelopment: NODE_ENV === "development",
    isProd: NODE_ENV === "production",
    isProduction: NODE_ENV === "production",
    isTest: NODE_ENV === "test",
    isStaging: NODE_ENV === "staging",
    isLocal: NODE_ENV === "local",
    enviroment: NODE_ENV,
  };
};

export const validateEnv = <T extends Record<string, any>>(
  schemaFn: (builder: {
    string: typeof string;
    number: typeof number;
    boolean: typeof boolean;
    array: typeof array;
    object: typeof object;
  }) => T,
  options?: {
    path?: string | string[];
    envVars?: Record<string, string | undefined>;
    prefix?: string;
  }
): ExtendedEnvSchema<{
  [K in keyof T]: T[K] extends SchemaDefinition<infer U> ? U : never;
}> => {
  const {
    path = [
      ".env",
      ".env.local",
      ".env.development",
      ".env.dev",
      ".env.test",
      ".env.stage",
      ".env.production",
      ".env.prod",
    ],
    envVars = getDefaultEnvVars(),
    prefix,
  } = options || {};

  // Only load dotenv in Node.js environment
  if (!isBrowser && typeof config === "function") {
    config({ path });
  }

  try {
    const envSchema = createEnvSchema(schemaFn);

    // If a prefix is provided, transform the environment variables to handle prefixed keys
    const processedEnvVars = prefix
      ? Object.entries(envVars).reduce(
          (acc, [key, value]) => {
            if (key.startsWith(prefix)) {
              const unprefixedKey = key.substring(prefix.length);
              acc[unprefixedKey] = value;
            }
            // Keep the original key too
            acc[key] = value;
            return acc;
          },
          {} as Record<string, string | undefined>
        )
      : envVars;

    const parsedEnv = envSchema.parse(processedEnvVars);
    return addEnvDerivedProperties(parsedEnv);
  } catch (error) {
    if (
      error instanceof SchemaError ||
      error instanceof MissingEnvVariableError ||
      error instanceof TransformationError ||
      error instanceof ValidationError
    ) {
      throw error;
    } else {
      throw new SchemaError(
        `Unexpected error during environment validation: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
};
