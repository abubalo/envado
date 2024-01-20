export class MissingEnvVariableError extends Error {
  constructor(errorMessage: string) {
    super(errorMessage);
    this.name = "MissingEnvVariableError";
  }
}

export class InvalidEnvVariableError extends Error {
  constructor(errorMessage: string) {
    super(errorMessage);
    this.name = "InvalidEnvVariableError";
  }
}
