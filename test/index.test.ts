import { describe, test, expect, beforeAll } from "vitest";
import envGuard from "../src/index";
import {InvalidEnvVariableError, MissingEnvVariableError} from "../src/CustomError"

describe("Env Guard Test Suite", () => {
  let env;

  beforeAll(() => {
    env = envGuard({
      SECRET_KEY: { type: "string" },
      API_KEY: { type: "string", defaultValue: "default-api-key" },
      ENABLE_FEATURE: { type: "boolean" },
      DEBUG_MODE: { type: "boolean", defaultValue: false },
      CONFIG_JSON: { type: "object", defaultValue: {} },
      TAGS: { type: "array", defaultValue: [] },
      PORT: { type: "number", defaultValue: 5000 },
    });
  });

  test("it should load string variables correctly", () => {
    expect(typeof env.SECRET_KEY).toBe("string");
  });

  test("it should have default value for API_KEY when not set", () => {
    expect(env.API_KEY).toBe("default-api-key");
  });

  test("it should throw MissingEnvVariableError for missing ENABLE_FEATURE", () => {
    expect(() => {
      delete process.env.ENABLE_FEATURE;
      envGuard({ ENABLE_FEATURE: { type: "boolean" } });
    }).toThrowError(MissingEnvVariableError);
  });

  test("it should have default value for DEBUG_MODE when not set", () => {
    expect(env.DEBUG_MODE).toBe(false);
  });

  test("it should parse CONFIG_JSON as an object", () => {
    expect(typeof env.CONFIG_JSON).toBe("object");
  });

  test("it should handle TAGS as an array", () => {
    expect(Array.isArray(env.TAGS)).toBe(true);
  });

  test("it should throw InvalidEnvVariableError for invalid PORT value", () => {
    process.env.PORT = "abc";
    expect(() => {
      envGuard({ PORT: { type: "number" } });
    }).toThrowError(InvalidEnvVariableError);
  });

  test("it should validate PORT within the specified range", () => {
    process.env.PORT = "70000"; // Invalid port number
    expect(() => {
      envGuard({
        PORT: {
          type: "number",
          defaultValue: 5000,
        },
      });
    }).toThrowError(InvalidEnvVariableError);
  });
});
