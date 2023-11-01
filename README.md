## EnvGuard

 EnvGuard is a lightweight and type-safe Node.js library designed to streamline the validation and retrieval of environment variables. It supports a variety of validation types, including strings, numbers, and booleans. It also provides a convenient way to parse and validate environment variables that contain JSON, URLs, and email addresses.

**Key Features**

- Type-safe environment variable validation
- Auto-completion and type checking
- Dynamic configuration for environment variables
- Lightweight and easy to integrate

**Installation**

```sh
npm i envguard
```

or

```sh
yarn add evnguard
```

**Usage**

To use the library, make sure you have your `.env` file in the project root directory. Simply call the `envguard` function with an object that defines the environment variables that you need to validate and load. For example:

EnvGuard supports several validation types to ensure that your environment variables have the expected format. Here are examples of how to use each validation type:

### `string`

```js
const evn = envguard({
  API_KEY: "string",
  USERNAME: "string",
});

// Access the validated values
const apiKey = evn.API_KEY; // A string
const username = evn.USERNAME; // A string
```

### `number`

```js
const evn = envguard({
  PORT: "number",
  TIMEOUT: "number",
});

// Access the validated values
const port = evn.PORT; // A number
const timeout = evn.TIMEOUT; // A number
```

### `boolean`

```js
const evn = envguard({
  ENABLE_FEATURE: "boolean",
  DEBUG_MODE: "boolean",
});

// Access the validated values
const enableFeature = evn.ENABLE_FEATURE; // A boolean
const debugMode = evn.DEBUG_MODE; // A boolean
```

### `json`

```js
const evn = envguard({
  CONFIG_JSON: "json",
  SETTINGS_JSON: "json",
});

// Access the validated values
const config = evn.CONFIG_JSON; // A parsed JSON object
const settings = evn.SETTINGS_JSON; // A parsed JSON object
```

### `array`

```js
const evn = envguard({
  TAGS: "array",
  IDS: "array",
});

// Access the validated values
const tags = evn.TAGS; // An array
const ids = evn.IDS; // An array
```

### `object`

```js
const evn = envguard({
  USER_PROFILE: "object",
  SYSTEM_CONFIG: "object",
});

// Access the validated values
const userProfile = evn.USER_PROFILE; // An object
const systemConfig = evn.SYSTEM_CONFIG; // An object
```

**Validation Types**

The following validation types are supported:

- `string`: Validates that the environment variable is a string.
- `number`: Validates that the environment variable is a number.
- `boolean`: Validates that the environment variable is a boolean.
- `json`: Validates that the environment variable is a valid JSON object.
- `array`: Validates that the environment variable is a valid array.
- `object`: Validates that the environment variable is a valid object.

**Error Handling**

If the `envguard` function detects an invalid environment variable, it will throw an error. You can handle these errors however you like. For example, you could log the error and exit the application.

```ts
import envguard from "envguard";

try {
  // Define the expected environment variables and their types
  const envConfig = envguard({
    SECRET_KEY: "string",
    API_KEY: "string",
    PORT: "number",
    DB_PORT: "number",
  });

  // Access validated environment variables
  const secretKey = envConfig.SECRET_KEY;
  const port = envConfig.PORT;

  console.log(
    "Environment variables have been successfully loaded and validated:"
  );
  console.log("SECRET_KEY:", secretKey);
  console.log("PORT:", port);
} catch (error) {
  // Handle errors that may occur during environment variable validation
  if (error instanceof Error) {
    console.error(
      "An error occurred while loading environment variables:",
      error.message
    );
    // You can choose to gracefully exit the application here or take other appropriate actions.
    process.exit(1); // Exiting the application with an error code.
  } else {
    console.error("An unexpected error occurred.");
  }
}
```

**License**
[MIT](/LICENSE)
