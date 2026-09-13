import { describe, expect, it } from "vitest";
import { buildCreateSellableProductRequest } from "./create-sellable-product-request";
import type { ProductFormValue } from "@/features/products/types";

function untrackedStandalone(): ProductFormValue {
  return {
    product: {
      name: "Digital",
      category: { id: "cat-1", name: "Cat" },
      variants: [],
      standaloneVariant: {
        sku: "SKU-DIGITAL",
        manageInventory: false,
      },
    },
    variationTypes: [],
  };
}

describe("create sellable product inventory tracking", () => {
  it("emits manageInventory false and empty inventory lines for untracked standalone", () => {
    const values = untrackedStandalone();

    const request = buildCreateSellableProductRequest(values);
    expect(request.product.variants).toEqual([
      {
        sku: "SKU-DIGITAL",
        variations: [],
        manageInventory: false,
      },
    ]);
    expect(request.inventoryLines).toEqual([]);
  });
});
