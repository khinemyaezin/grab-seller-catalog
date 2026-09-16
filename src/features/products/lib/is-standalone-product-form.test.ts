import { describe, expect, it } from "vitest";
import { isStandaloneProductForm } from "./is-standalone-product-form";

describe("isStandaloneProductForm", () => {
  it("is true when there are no variation types", () => {
    expect(isStandaloneProductForm([])).toBe(true);
    expect(isStandaloneProductForm(undefined)).toBe(true);
    expect(isStandaloneProductForm(null)).toBe(true);
  });

  it("is false when at least one variation type exists", () => {
    expect(isStandaloneProductForm([{ uuid: "t1", name: "Color", options: [] }])).toBe(false);
  });
});
