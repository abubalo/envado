
# Envado

Envado is a lightweight and type-safe library for parsing and validating environment variables in both Node.js and browser environments. It provides a minimal yet powerful API, ensuring expressiveness without bloating your project.

It is very minimal, ensures configuration is valid, reliable, and easy to manage, with TypeScript support for a seamless developer experience.


### Supported data types
- `string`
- `number`
- `array`
- `object`

## Features


- **Type-safe**: Full TypeScript support with automatic type inference.
- **Rich Validation**: Extensive built-in validators like ports, URL, emails, and more
- **Customizable**: Extend functionality with your own validators and transformers.
- **Environment Detection**: Built-in environment type helpers
- **Lightweight**: Zero dependencies (except for optional [dotenv]("https://npmjs.com/package/dotenv) integration).
- **Browser-Compactible**: Works seamlessly with bundlers like Vite, Webpack, and others.
- **Environment Detection**: Easily differentiate between development, production, test, and other environments.

## Installation

```bash
npm install envado
```

## Quick Start

```typescript
import { validateEnv } from 'envado';

const env = validateEnv(({string, number, array}) => ({
  PORT: number(),
  API_KEY: string(),
  ALLOWED_ORIGINS: array<string>().commaSeparated(),
  NODE_ENV: string()
}));

// TypeScript-safe access
console.log(env.PORT); // number
console.log(env.API_KEY); // string
```

## Built-in Validators

### String
```typescript
string()
  .email() // Validates international emails with punycode support
  .url() // Ensures valid URL format
  .min(length) // Minimum length
  .max(length) // Maximum length
  .oneOf(['a', 'b']) // Enumerated values
```

### Number
```typescript
number()
  .port() // Valid TCP port (1-65535)
  .min(value) // Minimum value
  .max(value) // Maximum value
```

### Boolean
```typescript
boolean() // Converts "true", "1", "yes" → true
         //         "false", "0", "no" → false
```

### Array
```typescript
array<T>()
  .commaSeparated() // Parse from comma-separated string
  .items(schema) // Validate each item
  .min(length) // Minimum array length
  .max(length) // Maximum array length
```

### Object
```typescript
object({
  key: string(),
  nested: object({...})
}).strict() // No additional properties allowed
```

## Common Modifiers

Every validator supports:

```typescript
.optional() // Make field optional
.custom(value => string | undefined) // Custom validation
.transform(value => newValue) // Custom transformation
```

## Environment Detection

Envado makes it easy to determine the current environment:

```ts
if (env.isDev) {
  console.log("Running in development mode");
}
```
Available properties:

- `env.isDev` → `NODE_ENV === 'development'`
- `env.isProd` → `NODE_ENV === 'production'`
- `env.isTest` → `NODE_ENV === 'test'`
- `env.isLocal` → `NODE_ENV === 'local'`
- `env.environment` → Raw `NODE_ENV` value

## Advanced Configuration
Envado allows custom .env file paths and overriding variables:

```ts
validateEnv(schema, {
  path: ['.env', '.env.production'], // Specify custom .env files
  envVars: import.meta, // Override `process.env` values
});
```


## Error Handling

```typescript
try {
  const env = validateEnv((builder) => ({
    PORT: builder.number().port()
  }));
} catch (error) {
  // Detailed validation errors:
  // "Environment validation failed:
  // PORT: Invalid port number"
}
```

## Advanced Example

```typescript
const env = validateEnv((builder) => ({
  // Database config
  DB_HOST: builder.string().host(),
  DB_PORT: builder.number().port(),
  DB_USER: builder.string(),
  DB_PASS: builder.string(),
  
  // Email configuration
  SMTP_SERVER: builder.string(),
  SMTP_PORT: builder.number().port(),
  ADMIN_EMAIL: builder.string().email(),
  
  // API configuration
  API_KEYS: builder.array<string>()
    .commaSeparated()
    .min(1)
    .transform(keys => keys.map(k => k.trim())),
  
  // Feature flags
  FEATURES: builder.object({
    enableCache: builder.boolean(),
    maxUsers: builder.number().min(1)
  }).strict()
}));
```

**License**
[MIT](/LICENSE)
