import { config } from "dotenv";

// config({ path: [".env", ".env.local", ".env.development", ".env.production"] });

type ValidationResult = string | void;
type Validator<T> = (value: T) => ValidationResult;
type AsyncValidator<T> = (value: T) => Promise<ValidationResult>;
type Transformer<T, U> = (value: T) => U;

type SchemaDefinition<T> = {
  readonly type: string;
  readonly validators: readonly Validator<T>[];
  readonly asyncValidators: readonly AsyncValidator<T>[];
  readonly transformers: readonly Transformer<any, any>[];
  readonly optional: boolean;
};

type InferSchemaType<T extends Record<string, SchemaDefinition<any>>> = {
  [K in keyof T]: T[K] extends SchemaDefinition<infer U> ? U : never;
};

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
    },

    email: () => {
      const newValidator: Validator<string> = (value) => {
        const trimmedEmail = value.trim();

        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

        // Regular expression for IPv6 format
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

        // Unicode categories for international email support
        // \p{L} - any kind of letter from any language
        // \p{N} - any kind of numeric character in any script
        // \p{M} - a character intended to be combined with another character (e.g. accents, umlauts, etc.)
        const internationalEmailRegex = new RegExp(
          '^(?:(?:[\\p{L}\\p{N}\\p{M}]+|"[^"]*")(?:\\.(?:[\\p{L}\\p{N}\\p{M}]+|"[^"]*"))*@(?:[\\p{L}\\p{N}](?:[\\p{L}\\p{N}-]*[\\p{L}\\p{N}])?\\.)+[\\p{L}]{2,}|\\[(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\])$',
          "u"
        );

        if (trimmedEmail.length === 0) {
          return "Email cannot be empty";
        }

        if (trimmedEmail.length > 254) {
          return "Email is too long (maximum is 254 characters)";
        }

        if (!trimmedEmail.includes("@")) {
          return "Email must contain an @ symbol";
        }

        const [localPart, domain] = trimmedEmail.split("@");

        if (!localPart || !domain) {
          return "Email must have both local part and domain";
        }

        if (localPart.length > 64) {
          return "Local part of email is too long (maximum is 64 characters)";
        }

        if (localPart.startsWith('"') && localPart.endsWith('"')) {
          const quotedContent = localPart.slice(1, -1);
          if (!/^[^"\\]*(?:\\[\s\S][^"\\]*)*$/.test(quotedContent)) {
            return "Invalid characters in quoted local part";
          }
        } else {
          if (
            /^\.|\.$|\.\.|[^\p{L}\p{N}\p{M}.!#$%&'*+/=?^_`{|}~-]/u.test(
              localPart
            )
          ) {
            return "Invalid characters in local part";
          }
        }

        if (domain.startsWith("[") && domain.endsWith("]")) {
          const ip = domain.slice(1, -1);

          if (ipv4Regex.test(ip)) {
            const parts = ip.split(".").map(Number);
            const isValidIPv4 = parts.every((part) => part >= 0 && part <= 255);
            if (!isValidIPv4) {
              return "Invalid IPv4 address in domain";
            }
          } else if (ipv6Regex.test(ip)) {
            const parts = ip.split(":").map((part) => parseInt(part, 16));
            const isValidIPv6 = parts.every(
              (part) => part >= 0 && part <= 65535
            );
            if (!isValidIPv6) {
              return "Invalid IPv6 address in domain";
            }
          } else {
            return "Invalid IP address format in domain";
          }
        } else {
          if (!domain.includes(".")) {
            return "Email domain must contain at least one dot";
          }

          if (domain.startsWith(".") || domain.endsWith(".")) {
            return "Email domain cannot start or end with a dot";
          }

          if (domain.includes("..")) {
            return "Email domain cannot contain consecutive dots";
          }

          const labels = domain.split(".");
          for (const label of labels) {
            if (label.length > 63) {
              return "Domain label cannot exceed 63 characters";
            }

            if (
              !/^[\p{L}\p{N}][\p{L}\p{N}-]*[\p{L}\p{N}]$/u.test(label) &&
              label.length > 1
            ) {
              return "Invalid domain label format";
            }
          }

          const tld = labels[labels.length - 1];
          if (!/^[\p{L}]{2,}$/u.test(tld)) {
            return "Invalid top-level domain";
          }
        }

        if (!internationalEmailRegex.test(trimmedEmail)) {
          return "Invalid email format";
        }

        return undefined;
      };

      return createSchemaBuilder({
        ...initialSchema,
        validators: [...initialSchema.validators, newValidator],
        transformers: [
          ...initialSchema.transformers,
          // Add punycode conversion for international domains
          (value: string) => {
            const [localPart, domain] = value.trim().split("@");
            if (domain && !domain.startsWith("[")) {
              // Convert international domain to punycode
              try {
                const punycoded = domain
                  .split(".")
                  .map((label) => {
                    try {
                      return /^[\x00-\x7F]*$/.test(label)
                        ? label
                        : "xn--" + label.normalize("NFKC").toLowerCase();
                    } catch {
                      return label;
                    }
                  })
                  .join(".");
                return `${localPart}@${punycoded}`;
              } catch {
                return value;
              }
            }
            return value;
          },
        ],
      }).schema;
    },
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
  value: unknown
): { value: T; errors: string[] } => {
  const errors: string[] = [];
  let currentValue: any = value;

  if (value === undefined) {
    if (schema.optional) {
      return { value: undefined as any, errors: [] };
    } else {
      return { value: undefined as any, errors: ["Required value is missing"] };
    }
  }

  try {
    currentValue = schema.transformers.reduce(
      (val, transformer) => transformer(val),
      currentValue
    );
  } catch (error) {
    errors.push(`Transformation failed: ${error}`);
    return { value: currentValue, errors };
  }

  schema.validators.forEach((validator) => {
    const result = validator(currentValue);
    if (result) errors.push(result);
  });

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
        const result = validateValue(schema, env[key]);
        return { key, ...result };
      });

      const errors = results
        .filter((result) => result.errors.length > 0)
        .map(({ key, errors }) => errors.map((error) => `${key}: ${error}`))
        .flat();

      if (errors.length > 0) {
        throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
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
      ".env.production",
      ".env.prod",
    ],
    envVars = process.env,
  } = options || {};

  config({ path });

  const envSchema = createEnvSchema(schemaFn);

  const parsedEnv = envSchema.parse(envVars);

  return addEnvDerivedProperties(parsedEnv);
};
