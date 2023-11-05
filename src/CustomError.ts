export class MissingEnvVariableError extends Error {
  constructor(envName: string) {
    super(`No environment variable matches "${envName}" in .env`);
    // super(`Environment variable "${envName}" is missing`);
    this.name = "MissingEnvVariableError";
  }
}

export class InvalidEnvVariableError extends Error {
  constructor(envName: string, value: string) {
    super(`Environment variable "${envName}" is invalid: ${value}`);
    this.name = "InvalidEnvVariableError";
  }
}
