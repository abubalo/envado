export class MissingEnvVariableError extends Error {
  constructor(variableName: string) {
    super(`Missing required environment variable: ${variableName}`);
    this.name = "MissingEnvVariableError";
  }
}

export class InvalidEnvVariableError extends Error {
  constructor(variableName: string, message: string) {
    super(`Invalid environment variable "${variableName}": ${message}`);
    this.name = "InvalidEnvVariableError";
  }
}
export class IncorrectEnvVariableError extends Error {
  constructor(variableName: string, message: string) {
    super(`Incorrect environment variable "${variableName}": ${message}`);
    this.name = "InvalidEnvVariableError";
  }
}

export class TransformationError extends Error {
  constructor(variableName: string, message: string) {
    super(`Transformation failed for environment variable "${variableName}": ${message}`);
    this.name = "TransformationError";
  }
}

export class ValidationError extends Error {
  constructor(variableName: string, message: string) {
    super(`Validation failed for environment variable "${variableName}": ${message}`);
    this.name = "ValidationError";
  }
}

export class SchemaError extends Error {
  constructor(message: string) {
    super(`Schema error: ${message}`);
    this.name = "SchemaError";
  }
}