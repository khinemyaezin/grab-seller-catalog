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
    medias: [
      {
        id: "local-1",
        url: "blob:hero",
        contentType: "image/jpeg",
        rank: 0,
        storageKey: "should-not-appear",
      },
    ],
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
    expect(request).not.toHaveProperty("medias");
  });

  it("does not copy form medias onto the workflow request", () => {
    const request = buildCreateSellableProductRequest(untrackedStandalone());

    expect(JSON.stringify(request)).not.toContain("blob:hero");
    expect(JSON.stringify(request)).not.toContain("should-not-appear");
    expect(request).not.toHaveProperty("medias");
  });
});
