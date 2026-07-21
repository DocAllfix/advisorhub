import { describe, expect, it } from "vitest";
import { ENGINE_VERSION } from "../src/index";

describe("engine placeholder", () => {
  it("esporta la versione", () => {
    expect(ENGINE_VERSION).toBe("0.0.1");
  });
});
