## Env Validator


This library provides a simple and effective way to validate and load environment variables in Node.js applications. It supports a variety of validation types, including strings, numbers, and booleans. It also provides a convenient way to parse and validate environment variables that contain JSON, URLs, and email addresses.

**Usage**

To use the library, simply call the `validateEnv` function with an object that defines the environment variables that you need to validate and load. For example:

```js
const envConfig = validateEnv({
  SECRET_KEY: "string",
  PORT: "number",
});
```

The `validateEnv` function will return an object that contains the validated environment variables. You can then access these variables using the dot notation. For example:

```javascript
const secretKey = envConfig.SECRET_KEY;
const port = envConfig.PORT;
```

**Validation Types**

The following validation types are supported:

* `string`: Validates that the environment variable is a string.
* `number`: Validates that the environment variable is a number.
* `boolean`: Validates that the environment variable is a boolean.
* `json`: Validates that the environment variable is a valid JSON object.
* `url`: Validates that the environment variable is a valid URL.
* `email`: Validates that the environment variable is a valid email address.

<!-- **Custom Validators**

You can also define your own custom validators. To do this, simply pass a function to the `validateAndLoadEnvVariable` function. The function should take the environment variable value as an argument and return `true` if the value is valid, or `false` otherwise.

For example, the following code defines a custom validator for validating port numbers:

```js

const validatePort = (value: string) => {
  const port = parseInt(value, 10); // Parse as an integer directly
  return !isNaN(port) && port >= 1 && port <= 65535;
};

``` -->
You can then use this validator to validate the PORT environment variable as follows:

JavaScript
const envConfig = validateEnv({
  PORT: "number",
  validatePort,
});


**Error Handling**

If the `validateEnv` function detects an invalid environment variable, it will throw an error. You can handle these errors however you like. For example, you could log the error and exit the application, or you could prompt the user to enter a valid value.


**License**
[MIT](/LICENSE)

