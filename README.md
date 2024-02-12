## Envado

Envado is a type-safe Node.js library created to streamline the validation and retrieval of environment variables. It supports a variety of validation types, including strings, numbers, booleans and more.

 <!-- It also provides a convenient way to parse and validate environment variables that contain JSON, URLs, and email addresses. -->

**Key Features**

- Type-safe environment variable validation
- Auto-completion and type-checking
- Dynamic configuration for environment variables
- Lightweight and easy to integrate

**Installation**

```bash
npm install --save-dev envado
```

**Usage**

To use the library, make sure you have your `.env` file in the project root directory. Simply call the `envado` function with an object that defines the environment variables that you need to validate and load. For example:

```ts
import envado from "envado";

const env = envado({
  API_KEY: { type: "string" },
  PORT: { type: "number" },
  DEBUG_MODE: "boolean",
  TAGS: { type: "array" },
  SERVER_CONFIG: {type: "object"}
});
```

### Setting Default value

You can set the default value for the environment, which will be the fallback value when the value in the `.env` is undefined. For example:

```js
const env = envado({
  PUBLIC_URL: { type: "string", defaultValue: "https://example.com" },
  PORT: { type: "number", defaultValue: 5000 },
  DEBUG_MODE: { type: "boolean", defaultValue: true },
  TAGS: { type: "array", defaultValue: ["foo", "bar"] },
  DATABASE_CONFIG: { type: "object", defaultValue: {
    host: "localhost",
    port: 5432,
    username: "admin",
    password: "password123",
    databaseName: "myapp"
  } },
});
```

Envado supports several validation types to ensure that your environment variables have the expected format. Here are examples of how to use each validation type:



**Validation Types**

The following validation types are supported:

- `string`: Validates that the environment variable is a string.
- `number`: Validates that the environment variable is a number.
- `boolean`: Validates that the environment variable is a boolean.
- `array`: Validates that the environment variable is a valid array.
- `object`: Validates that the environment variable is a valid object.


**License**
[MIT](/LICENSE)
