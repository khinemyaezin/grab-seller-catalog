import { describe, expect, it } from "vitest";
import { transformProductToFormValue } from "./use-product-edit";
import type { GetFullProductResponse } from "../types";

function makeProduct(
  overrides: Partial<GetFullProductResponse> = {},
): GetFullProductResponse {
  return {
    id: "prod-1",
    name: "T-Shirt",
    category: { id: "cat-1", name: "Apparel" },
    sellerId: "seller-1",
    sellerType: "B2C",
    condition: "NEW",
    offerEligible: true,
    status: "ACTIVE",
    slug: "t-shirt",
    featured: false,
    descriptions: null,
    medias: null,
    moderationNote: null,
    variants: [],
    variantTypes: [],
    ...overrides,
  };
}

describe("transformProductToFormValue", () => {
  it("formats variant names with multiple options", () => {
    const apiData = makeProduct({
      variants: [
        {
          id: "var-1",
          sku: "TSHIRT-RED-L",
          status: "ACTIVE",
          matrixKey: "red-l",
          manageInventory: true,
          variations: [
            { typeId: "t1", typeName: "Color", optionId: "o1", optionName: "Red" },
            { typeId: "t2", typeName: "Size", optionId: "o2", optionName: "Large" },
          ],
        },
      ],
      variantTypes: [
        {
          typeId: "t1",
          typeName: "Color",
          options: [{ optionId: "o1", optionName: "Red" }],
        },
        {
          typeId: "t2",
          typeName: "Size",
          options: [{ optionId: "o2", optionName: "Large" }],
        },
      ],
    });

    const formValue = transformProductToFormValue(apiData);

    expect(formValue.product.variants[0]).toEqual({
      id: "var-1",
      name: "Red / Large",
      matrixKey: "red-l",
      sku: "TSHIRT-RED-L",
      price: "",
      manageInventory: true,
      variations: [
        { typeId: "t1", optionId: "o1" },
        { typeId: "t2", optionId: "o2" },
      ],
    });
  });

  it("maps a standalone variant when variantTypes is empty", () => {
    const standalone = {
      id: "var-2",
      sku: "MUG-1",
      status: "DRAFT",
      matrixKey: "",
      manageInventory: true,
      variations: [],
    };
    const apiData = makeProduct({
      name: "Simple Mug",
      variants: [standalone],
      variantTypes: [],
    });

    const formValue = transformProductToFormValue(apiData);

    expect(formValue.product.standaloneVariant).toEqual({
      ...standalone,
      manageInventory: true,
    });
    expect(formValue.variationTypes).toEqual([]);
  });

  it("appends a trailing empty option on each variation type", () => {
    const apiData = makeProduct({
      variantTypes: [
        {
          typeId: "t1",
          typeName: "Color",
          options: [{ optionId: "o1", optionName: "Red" }],
        },
      ],
    });

    const formValue = transformProductToFormValue(apiData);

    expect(formValue.variationTypes).toEqual([
      {
        uuid: "t1",
        name: "Color",
        options: [
          { uuid: "o1", name: "Red" },
          { uuid: "", name: "" },
        ],
      },
    ]);
  });

  it("sets category to null when API category is missing", () => {
    const apiData = {
      ...makeProduct(),
      category: undefined,
    } as unknown as GetFullProductResponse;

    const formValue = transformProductToFormValue(apiData);

    expect(formValue.product.category).toBeNull();
  });
});
