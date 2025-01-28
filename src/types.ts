export type ValidationResult = string | void;
export type Validator<T> = (value: T) => ValidationResult;
export type AsyncValidator<T> = (value: T) => Promise<ValidationResult>;
export type Transformer<T, U> = (value: T) => U;

export type SchemaDefinition<T> = {
  readonly type: string;
  readonly validators: readonly Validator<T>[];
  readonly asyncValidators: readonly AsyncValidator<T>[];
  readonly transformers: readonly Transformer<any, any>[];
  readonly optional: boolean;
  readonly default?: T
};

export type InferSchemaType<T extends Record<string, SchemaDefinition<any>>> = {
  [K in keyof T]: T[K] extends SchemaDefinition<infer U> ? U : never;
};

export type ExtendedEnvSchema<T> = T & {
  isDev: boolean;
  isProd: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  isStaging: boolean;
  isLocal: boolean;
  enviroment: string;
};
