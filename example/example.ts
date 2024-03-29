import envGuard from "../src/temp2";

const envConfig = envGuard({
  SECRET_KEY: { type: "string" },
  API_KEY: { type: "string", defaultValue: "default-api-key" },
  ENABLE_FEATURE: { type: "boolean" },
  DEBUG_MODE: { type: "boolean", defaultValue: false },
  CONFIG_JSON: { type: "object", defaultValue: {} },
  TAGS: { type: "array", defaultValue: ["ff"] },
  PORT: { type: "number", defaultValue: 5000 },
});

console.log("SECRET_KEY:", envConfig.SECRET_KEY);
console.log("API_KEY:", envConfig.API_KEY);
console.log("PORT:", envConfig.PORT);
console.log("PORT datatype:", typeof envConfig.PORT);
console.log("Tags datatype:", typeof envConfig.TAGS);
console.log("DEBUG_MODE datatype", envConfig.DEBUG_MODE);