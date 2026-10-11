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
        storageKey: "staged/hero.jpg",
      },
    ],
    descriptions: [
      {
        name: "overview",
        title: "Overview",
        description: "Handmade mug copy",
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
    expect(request.medias).toEqual([
      {
        id: "local-1",
        storageKey: "staged/hero.jpg",
        contentType: "image/jpeg",
        rank: 0,
      },
    ]);
    expect(request.descriptions).toEqual([
      {
        name: "overview",
        title: "Overview",
        description: "Handmade mug copy",
      },
    ]);
  });

  it("includes product status and publicationLines on the create payload", () => {
    const values = untrackedStandalone();
    values.product.status = "ACTIVE";
    values.product.publicationLines = [{ sku: "SKU-DIGITAL", salesChannelId: "web-1" }];

    const request = buildCreateSellableProductRequest(values);

    expect(request.product.status).toBe("ACTIVE");
    expect(request.publicationLines).toEqual([
      { sku: "SKU-DIGITAL", salesChannelId: "web-1" },
    ]);
  });

  it("copies staged medias and descriptions onto the workflow request", () => {
    const request = buildCreateSellableProductRequest(untrackedStandalone());

    expect(JSON.stringify(request)).not.toContain("blob:hero");
    expect(request.medias).toEqual([
      {
        id: "local-1",
        storageKey: "staged/hero.jpg",
        contentType: "image/jpeg",
        rank: 0,
      },
    ]);
    expect(request.descriptions).toEqual([
      {
        name: "overview",
        title: "Overview",
        description: "Handmade mug copy",
      },
    ]);
  });
});
