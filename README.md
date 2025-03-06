# Envado

Envado is a lightweight and type-safe library for parsing and validating environment variables in both Node.js and browser environments. It provides a minimal yet powerful API, ensuring expressiveness without bloating your project.

[![npm version](https://img.shields.io/npm/v/envado.svg)](https://www.npmjs.com/package/envado)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-blue)](https://www.typescriptlang.org/)

## Features

- **Type-safe**: Full TypeScript support with automatic type inference
- **Rich Validation**: Extensive built-in validators for common use cases
- **Customizable**: Extend functionality with your own validators and transformers
- **Environment Detection**: Built-in environment type helpers
- **Lightweight**: Zero dependencies (except for optional [dotenv](https://npmjs.com/package/dotenv) integration)
- **Browser-Compatible**: Works seamlessly with bundlers like Vite, Webpack, and others
- **Intelligent Defaults**: Sensible defaults that handle most common use cases

## Installation

```bash
npm install envado
```

## Quick Start

```typescript
import { validateEnv } from "envado";

const env = validateEnv(({ string, number, array }) => ({
  PORT: number({ default: 3000 }),
  API_KEY: string(),
  ALLOWED_ORIGINS: array<string>(),
  NODE_ENV: string(),
}));

// TypeScript-safe access
console.log(env.PORT); // number
console.log(env.API_KEY); // string
```

## Validators and Modifiers

| Validator    | Methods                                   | Description                                |
|--------------|-------------------------------------------|--------------------------------------------|
| `string()`   | `.oneOf(['a', 'b'])` <br> `.url()` <br> `.email()` <br> `.min(length)` <br> `.max(length)` | String validation with various constraints |
| `number()`   | `.min(value)` <br> `.max(value)` <br> `.port()` | Number validation with range constraints |
| `boolean()`  | | Converts truthy/falsy strings to booleans |
| `array()`    | `.min(length)` <br> `.max(length)` <br> `.items(schema)` <br> `.withSeparator(separator)` | Auto-parses comma-separated strings to arrays |
| `object()`   | `.strict()` | Validates nested object structures |

### Common Modifiers

All validators support these modifiers:

```typescript
.optional()                        // Make field optional
.custom(value => string|undefined) // Custom validation
.transform(value => newValue)      // Custom transformation
```

## Environment Detection

Envado makes it easy to determine the current environment:

```typescript
if (env.isDev) {
  console.log("Running in development mode");
}
```

Available properties:

| Property | Description |
|----------|-------------|
| `env.isDev` | `NODE_ENV === 'development'` |
| `env.isProd` | `NODE_ENV === 'production'` |
| `env.isTest` | `NODE_ENV === 'test'` |
| `env.isStaging` | `NODE_ENV === 'staging'` |
| `env.isLocal` | `NODE_ENV === 'local'` |
| `env.environment` | Raw `NODE_ENV` value |

## Browser Support (Vite, Webpack, etc.)

Envado works seamlessly with browser bundlers like Vite and Webpack:

```typescript
import { validateEnv } from "envado";

// For Vite
const env = validateEnv(schema, {
  envVars: import.meta.env,
  prefix: "VITE_"
});

// Access as usual
console.log(env.API_URL);
```

## Advanced Configuration

Envado allows custom .env file paths and overriding variables:

```typescript
validateEnv(schema, {
  // Specify custom .env files (Node.js only)
  path: [".env", ".env.test"],
  
  // Override `process.env` values
  envVars: import.meta.env,
  
  // Specify a prefix for env variables (e.g., VITE_)
  prefix: "VITE_",
});
```

## Error Handling

```typescript
try {
  const env = validateEnv((builder) => ({
    PORT: builder.number().port(),
  }));
} catch (error) {
  // Detailed validation errors:
  // "Environment validation failed:
  // PORT: Invalid port number"
}
```

## Validation Table

| Validator | Method | Description | Example |
|-----------|--------|-------------|---------|
| `string()` | `.oneOf(['a', 'b'])` | Validates string is one of provided values | `string().oneOf(['dev', 'prod'])` |
| | `.url()` | Validates string is a valid URL | `string().url()` |
| | `.email()` | Validates string is a valid email | `string().email()` |
| | `.min(length)` | Validates minimum string length | `string().min(8)` |
| | `.max(length)` | Validates maximum string length | `string().max(100)` |
| `number()` | `.min(value)` | Validates minimum value | `number().min(1)` |
| | `.max(value)` | Validates maximum value | `number().max(65535)` |
| | `.port()` | Validates is a valid port number (1-65535) | `number().port()` |
| `boolean()` | | Converts strings to booleans | `boolean({ default: false })` |
| `array()` | `.min(length)` | Validates minimum array length | `array().min(1)` |
| | `.max(length)` | Validates maximum array length | `array().max(10)` |
| | `.items(schema)` | Validates each array item | `array().items(number().min(0))` |
| | `.withSeparator(sep)` | Sets custom separator | `array().withSeparator('|')` |
| `object()` | `.strict()` | Disallows extra properties | `object(schema).strict()` |

## Advanced Example

```typescript
const env = validateEnv((builder) => ({
  // Database config
  DB_HOST: builder.string(),
  DB_PORT: builder.number().port(),
  DB_USER: builder.string(),
  DB_PASS: builder.string(),
  
  // Email configuration
  SMTP_SERVER: builder.string(),
  SMTP_PORT: builder.number().port(),
  ADMIN_EMAIL: builder.string().email(),
  
  // API configuration
  API_KEYS: builder
    .array<string>()
    .min(1),
    
  // Feature flags
  FEATURES: builder
    .object({
      enableCache: builder.boolean(),
      maxUsers: builder.number().min(1),
    })
    .strict(),
}));
```

## Custom Validation Example

```typescript
const env = validateEnv((builder) => ({
  // Define a custom validator for API keys
  API_KEY: builder.string().custom(value => {
    const regex = /^[A-Z0-9]{32}$/;
    return regex.test(value) ? undefined : 'API key must be 32 uppercase alphanumeric characters';
  }),
  
  // Custom transformation
  DATABASE_URL: builder.string().transform(url => {
    // Add SSL parameters if not present
    if (!url.includes('sslmode=')) {
      return `${url}?sslmode=require`;
    }
    return url;
  }),
}));
```

## Working with Multiple Environments

```typescript
// .env.development
const devEnv = validateEnv(schema, { path: '.env.development' });

// .env.production
const prodEnv = validateEnv(schema, { path: '.env.production' });

// Dynamic based on NODE_ENV
const env = validateEnv(schema, { 
  path: `.env.${process.env.NODE_ENV || 'development'}` 
});
```

## License

[MIT](/LICENSE)