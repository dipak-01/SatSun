import { describe, it, expect, beforeEach } from "vitest";
import { lsGetJSON, lsSetJSON } from "../lib/storage";

describe("storage JSON helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("writes and reads JSON from localStorage", () => {
    const key = "test:key";
    const value = { a: 1, b: "two" };
    lsSetJSON(key, value);
    expect(localStorage.getItem(key)).toBe(JSON.stringify(value));
    const read = lsGetJSON(key);
    expect(read).toEqual(value);
  });

  it("returns undefined for missing or invalid JSON", () => {
    expect(lsGetJSON("missing")).toBeUndefined();
    localStorage.setItem("bad", "{not json}");
    expect(lsGetJSON("bad")).toBeUndefined();
  });
});
