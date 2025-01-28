import { config } from "dotenv";
import {
  MissingEnvVariableError,
  SchemaError,
  TransformationError,
  ValidationError,
} from "./errors";
import { InferSchemaType, SchemaDefinition, ValidationResult, Validator, Transformer } from "./types";



const string = () => {
  const initialSchema: SchemaDefinition<string> = {
    type: "string",
    validators: [
      (value): ValidationResult =>
        typeof value.trim() !== "string"
          ? `Expected string, but got ${typeof value}`
          : undefined,
    ],
    asyncValidators: [],
    transformers: [],
    optional: false,
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
    }
  };
};

const number = () => {
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

const boolean = () => {
  const booleanTransformer = (value: string | boolean): boolean => {
    if (typeof value === "boolean") return value;
    const normalized = value.toLowerCase().trim();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
    throw new Error("Invalid boolean value");
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
  };

  return createSchemaBuilder(initialSchema).schema;
};

const array = <T>() => {
  const initialSchema: SchemaDefinition<T[]> = {
    type: "array",
    validators: [
      (value): ValidationResult => {
        if (!Array.isArray(value)) {
          return `Expected array, but got ${typeof value}`;
        }
      },
    ],
    asyncValidators: [],
    transformers: [],
    optional: false,
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

    commaSeparated: () =>
      createSchemaBuilder({
        ...initialSchema,
        transformers: [
          (value: string) => value.split(",").map((item) => item.trim()),
        ],
      }).schema,
  };
};

const object = <T extends Record<string, SchemaDefinition<any>>>(schema: T) => {
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

// const json = <T extends Record<string, SchemaDefinition<T>>>(schema: T) => {
//   const initialSchema: SchemaDefinition<string> = {
//     type: "json",
//     validators: [
//       (value) => {
//         if (typeof value !== "string" || value === null) {
//           return `Expexted JSON, but got ${typeof value}`;
//         }
//       },
//     ],
//     asyncValidators: [],
//     transformers: [],
//     optional: false,
//   };

//   return {
//     ...createSchemaBuilder(initialSchema).schema,
//   };
// };

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

  if (value === undefined) {
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
  T extends Record<string, SchemaDefinition<any>>
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
    parse: (env: Record<string, string | undefined> = process.env) => {
      const results = Object.entries(schema).map(([key, schema]) => {
        try {
          const result = validateValue(schema, env[key], key);
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

type ExtendedEnvSchema<T> = T & {
  isDev: boolean;
  isProd: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  isStaging: boolean;
  isLocal: boolean;
  enviroment: string;
};

const addEnvDerivedProperties = <T extends Record<string, any>>(
  parsedEnv: T
) => {
  const NODE_ENV = parsedEnv.NODE_ENV;

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
  options?: { path?: string; envVars?: Record<string, string | undefined> }
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
    envVars = process.env,
  } = options || {};

  config({ path });

  try {
    const envSchema = createEnvSchema(schemaFn);
    const parsedEnv = envSchema.parse(envVars);
    return addEnvDerivedProperties(parsedEnv);
  } catch (error) {
    if (
      error instanceof SchemaError ||
      error instanceof MissingEnvVariableError ||
      error instanceof TransformationError ||
      error instanceof ValidationError
    ) {
      throw error; // Re-throw custom errors
    } else {
      throw new SchemaError(
        `Unexpected error during environment validation: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
};
