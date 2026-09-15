import { describe, expect, it } from "vitest";
import { buildUpdateSellableProductRequest } from "./update-sellable-product-request";
import type { ProductFormValue } from "@/features/products/types";

function formWithMedia(): ProductFormValue {
  return {
    product: {
      name: "Mug",
      category: { id: "cat-1", name: "Cat" },
      variants: [],
      standaloneVariant: {
        sku: "SKU-MUG",
        manageInventory: false,
      },
    },
    variationTypes: [],
    medias: [
      {
        id: "media-1",
        url: "https://cdn/hero.jpg",
        contentType: "image/jpeg",
        rank: 0,
        storageKey: "merchants/m/products/prod-1/hero.jpg",
      },
    ],
  };
}

describe("buildUpdateSellableProductRequest", () => {
  it("does not copy form medias onto the workflow request", () => {
    const request = buildUpdateSellableProductRequest(
      "prod-1",
      formWithMedia(),
      "COLLAPSE_TO_STANDALONE",
    );

    expect(request.productId).toBe("prod-1");
    expect(request.product.name).toBe("Mug");
    expect(request).not.toHaveProperty("medias");
    expect(JSON.stringify(request)).not.toContain("hero.jpg");
    expect(JSON.stringify(request)).not.toContain("media-1");
  });
});
