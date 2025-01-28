import { validateEnv } from "../src/temp";

const envSchema = validateEnv(({ string, number, boolean, array }) => ({
  NODE_ENV: string(),
  API_URL: string(),
  EMAIL: string(),

  PORT: number(),
  TIMEOUT: number(),

  DEBUG: boolean(),
  FEATURE_FLAGS: boolean(),

  CORS_ORIGINS: array<string>().commaSeparated()

}));


console.log(envSchema)