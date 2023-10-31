import * as dotenv from "dotenv";

dotenv.config();

function validateAndLoadEnvVariable(
  envName: string,
  defaultValue: string | number,
  validator?: (value: string | number) => boolean
): string | number {
  const value = process.env[envName];

  if (value === undefined || value === "") {
    throw new Error(`Environment variable "${envName}" is missing`);
  }

  if (validator && !validator(value)) {
    throw new Error(`Environment variable "${envName}" is invalid: ${value}`);
  }

  return value;
}

function validateEnv(config: { [envName: string]: string | number }): {
  [envName: string]: string | number;
} {
  const result: { [envName: string]: string | number } = {};

  for (const envName in config) {
    if (config.hasOwnProperty(envName)) {
      const type = config[envName];
      let validate;

      if (typeof type === "number") {
        validate = validateAndLoadEnvVariable(envName, type, (value) => {
          const port = parseInt(value, 10); // Parse as an integer directly
          return !isNaN(port) && port >= 1 && port <= 65535;
        });
      } else {
        validate = validateAndLoadEnvVariable(envName, type);
      }

      result[envName] = validate;
    }
  }

  return result;
}

export default validateEnv
