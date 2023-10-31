import validateEnv from "../src/index";

// Call the validateEnv function to validate and load environment variables
const envConfig = validateEnv({
  SECRET_KEY: "string",
});

export { validateEnv };
// console.log("Environment Configuration:", envConfig);

// Access the validated values directly
console.log("SECRET_KEY:", envConfig.SECRET_KEY);
