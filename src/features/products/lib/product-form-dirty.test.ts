import { describe, expect, it } from "vitest";
import { isCatalogFormDirty } from "./product-form-dirty";

describe("isCatalogFormDirty", () => {
  it("is false when only unrelated fields changed", () => {
    expect(isCatalogFormDirty({}, false)).toBe(false);
  });

  it("is true when product, variation types, or extension slots changed", () => {
    expect(isCatalogFormDirty({ product: {} }, false)).toBe(true);
    expect(isCatalogFormDirty({ variationTypes: [] }, false)).toBe(true);
    expect(isCatalogFormDirty({}, true)).toBe(true);
  });
});
