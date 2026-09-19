import { describe, expect, it } from "vitest";
import { diffProductPublications } from "./diff-product-publications";
import { DEFAULT_PRODUCT_FORM_VALUE } from "./product-form-defaults";
import type { ProductFormValue } from "@/features/products/types";

function matrixForm(overrides: Partial<ProductFormValue["product"]> = {}): ProductFormValue {
  return {
    ...DEFAULT_PRODUCT_FORM_VALUE,
    variationTypes: [
      {
        uuid: "t1",
        name: "Color",
        options: [{ uuid: "o1", name: "Red" }],
      },
    ],
    product: {
      name: "Shirt",
      category: { id: "cat-1", name: "Cat" },
      variants: [
        {
          id: "var-1",
          name: "Red",
          matrixKey: "red",
          sku: "SKU-1",
          variations: [{ typeId: "t1", optionId: "o1" }],
        },
      ],
      standaloneVariant: { sku: "" },
      publicationLines: [{ sku: "SKU-1", salesChannelId: "web-1" }],
      ...overrides,
    },
  };
}

describe("diffProductPublications", () => {
  it("returns added publication lines using the current form sku", () => {
    const seed = matrixForm();
    const values = matrixForm({
      publicationLines: [
        { sku: "SKU-1", salesChannelId: "web-1" },
        { sku: "SKU-1", salesChannelId: "mkt-1" },
      ],
    });

    expect(diffProductPublications(seed, values)).toEqual({
      publicationLines: [{ sku: "SKU-1", salesChannelId: "mkt-1" }],
      unpublish: [],
    });
  });

  it("returns unpublish lines from the saved sku and channel", () => {
    const seed = matrixForm();
    const values = matrixForm({
      publicationLines: [],
    });

    expect(diffProductPublications(seed, values)).toEqual({
      publicationLines: [],
      unpublish: [{ sku: "SKU-1", salesChannelId: "web-1" }],
    });
  });

  it("skips unpublish for unsaved variants", () => {
    const seed = matrixForm({
      variants: [],
      publicationLines: [],
    });
    const values = matrixForm({
      variants: [
        {
          name: "Red",
          matrixKey: "red",
          sku: "SKU-NEW",
          variations: [{ typeId: "t1", optionId: "o1" }],
        },
      ],
      publicationLines: [{ sku: "SKU-NEW", salesChannelId: "web-1" }],
    });

    expect(diffProductPublications(seed, values)).toEqual({
      publicationLines: [{ sku: "SKU-NEW", salesChannelId: "web-1" }],
      unpublish: [],
    });
  });

  it("diffs standalone variant publications", () => {
    const seed: ProductFormValue = {
      ...DEFAULT_PRODUCT_FORM_VALUE,
      product: {
        name: "Mug",
        category: { id: "cat-1", name: "Cat" },
        variants: [],
        standaloneVariant: {
          id: "var-2",
          sku: "MUG-1",
        },
        publicationLines: [{ sku: "MUG-1", salesChannelId: "web-1" }],
      },
    };
    const values: ProductFormValue = {
      ...seed,
      product: {
        ...seed.product,
        publicationLines: [{ sku: "MUG-1", salesChannelId: "mkt-1" }],
      },
    };

    expect(diffProductPublications(seed, values)).toEqual({
      publicationLines: [{ sku: "MUG-1", salesChannelId: "mkt-1" }],
      unpublish: [{ sku: "MUG-1", salesChannelId: "web-1" }],
    });
  });

  it("does not unpublish a standalone sku after conversion to matrix variants", () => {
    const seed: ProductFormValue = {
      ...DEFAULT_PRODUCT_FORM_VALUE,
      product: {
        name: "Shirt",
        category: { id: "cat-1", name: "Cat" },
        variants: [],
        standaloneVariant: {
          id: "var-0",
          sku: "SKU-STANDALONE",
        },
        publicationLines: [
          { sku: "SKU-STANDALONE", salesChannelId: "web-1" },
          { sku: "SKU-STANDALONE", salesChannelId: "mkt-1" },
        ],
      },
    };
    const values = matrixForm({
      variants: [
        {
          name: "M",
          matrixKey: "m",
          sku: "SKU-M",
          variations: [{ typeId: "t1", optionId: "o1" }],
        },
        {
          name: "L",
          matrixKey: "l",
          sku: "SKU-L",
          variations: [{ typeId: "t1", optionId: "o2" }],
        },
      ],
      publicationLines: [
        { sku: "SKU-M", salesChannelId: "web-1" },
        { sku: "SKU-L", salesChannelId: "web-1" },
        { sku: "SKU-L", salesChannelId: "mkt-1" },
      ],
    });

    expect(diffProductPublications(seed, values)).toEqual({
      publicationLines: [
        { sku: "SKU-M", salesChannelId: "web-1" },
        { sku: "SKU-L", salesChannelId: "web-1" },
        { sku: "SKU-L", salesChannelId: "mkt-1" },
      ],
      unpublish: [],
    });
  });
});
