import { describe, expect, it } from "vitest";
import { isCatalogFormDirty } from "./product-form-dirty";

describe("isCatalogFormDirty", () => {
  it("is false when only medias changed", () => {
    expect(isCatalogFormDirty({}, false)).toBe(false);
    expect(isCatalogFormDirty({ medias: [] }, false)).toBe(false);
  });

  it("is true for any other dirty key or extension slots", () => {
    expect(isCatalogFormDirty({ product: {} }, false)).toBe(true);
    expect(isCatalogFormDirty({ variationTypes: [] }, false)).toBe(true);
    expect(isCatalogFormDirty({ medias: [], product: {} }, false)).toBe(true);
    expect(isCatalogFormDirty({}, true)).toBe(true);
  });
});
