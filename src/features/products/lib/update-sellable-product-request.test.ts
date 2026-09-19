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
    descriptions: [
      {
        id: "desc-1",
        name: "overview",
        title: "Overview",
        description: "Soft cotton mug",
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
    expect(request).not.toHaveProperty("descriptions");
    expect(JSON.stringify(request)).not.toContain("hero.jpg");
    expect(JSON.stringify(request)).not.toContain("media-1");
    expect(JSON.stringify(request)).not.toContain("Soft cotton mug");
  });

  it("copies added publication lines onto the workflow request", () => {
    const request = buildUpdateSellableProductRequest(
      "prod-1",
      formWithMedia(),
      "COLLAPSE_TO_STANDALONE",
      {
        publicationLines: [{ sku: "SKU-MUG", salesChannelId: "web-1" }],
      },
    );

    expect(request.publicationLines).toEqual([
      { sku: "SKU-MUG", salesChannelId: "web-1" },
    ]);
  });

  it("copies unpublish lines onto the workflow request", () => {
    const request = buildUpdateSellableProductRequest(
      "prod-1",
      formWithMedia(),
      "COLLAPSE_TO_STANDALONE",
      {
        unpublishLines: [{ sku: "SKU-MUG", salesChannelId: "web-1" }],
      },
    );

    expect(request.unpublishLines).toEqual([
      { sku: "SKU-MUG", salesChannelId: "web-1" },
    ]);
  });
});
