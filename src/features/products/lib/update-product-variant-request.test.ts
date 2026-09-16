import { describe, expect, it } from "vitest";
import { buildUpdateProductVariantRequest } from "./update-product-variant-request";
import type { ProductVariantForm } from "@/features/products/types";

function makeVariant(overrides: Partial<ProductVariantForm> = {}): ProductVariantForm {
  return {
    id: "var-1",
    name: "Red / Large",
    matrixKey: "red-l",
    sku: "TSHIRT-RED-L",
    manageInventory: true,
    variations: [
      { typeId: "t1", optionId: "o1" },
      { typeId: "t2", optionId: "o2" },
    ],
    ...overrides,
  };
}

describe("buildUpdateProductVariantRequest", () => {
  it("emits catalog-only fields when slots contribute nothing", () => {
    const request = buildUpdateProductVariantRequest("prod-1", "var-1", makeVariant());

    expect(request).toEqual({
      productId: "prod-1",
      variantId: "var-1",
      sku: "TSHIRT-RED-L",
      manageInventory: true,
    });
    expect(request).not.toHaveProperty("price");
    expect(request).not.toHaveProperty("inventoryLines");
    expect(request).not.toHaveProperty("product");
    expect(request).not.toHaveProperty("pricingLines");
  });

  it("maps the matching pricing line onto price and drops sku and variantId", () => {
    const request = buildUpdateProductVariantRequest("prod-1", "var-1", makeVariant(), {
      pricingLines: [
        { sku: "OTHER", currencyCode: "EUR", amount: 9.99 },
        {
          sku: "TSHIRT-RED-L",
          variantId: "var-1",
          title: "Base",
          currencyCode: "USD",
          amount: 19.99,
          minQuantity: 1,
          maxQuantity: 10,
          rules: [{ attribute: "currency_code", value: "USD" }],
        },
      ],
    });

    expect(request.price).toEqual({
      title: "Base",
      currencyCode: "USD",
      amount: 19.99,
      minQuantity: 1,
      maxQuantity: 10,
      rules: [{ attribute: "currency_code", value: "USD" }],
    });
    expect(request.price).not.toHaveProperty("sku");
    expect(request.price).not.toHaveProperty("variantId");
  });

  it("falls back to the first pricing line when none match the variant sku", () => {
    const request = buildUpdateProductVariantRequest("prod-1", "var-1", makeVariant(), {
      pricingLines: [{ sku: "OTHER", currencyCode: "USD", amount: 5 }],
    });

    expect(request.price).toEqual({
      currencyCode: "USD",
      amount: 5,
    });
  });

  it("passes inventory lines through without inventing extra fields", () => {
    const inventoryLines = [
      {
        sku: "TSHIRT-RED-L",
        locationId: "loc-1",
        op: "CREATE" as const,
        create: { initialQuantity: 10, safetyStock: 2 },
      },
      {
        sku: "TSHIRT-RED-L",
        inventoryItemId: "inv-1",
        op: "ADJUST" as const,
        adjust: { newOnHandQuantity: 8, reason: "CYCLE_COUNT" },
      },
    ];

    const request = buildUpdateProductVariantRequest("prod-1", "var-1", makeVariant(), {
      inventoryLines,
    });

    expect(request.inventoryLines).toEqual(inventoryLines);
  });

  it("emits manageInventory false from the form toggle", () => {
    const request = buildUpdateProductVariantRequest(
      "prod-1",
      "var-1",
      makeVariant({ manageInventory: false }),
    );

    expect(request.manageInventory).toBe(false);
  });

  it("omits empty inventoryLines", () => {
    const request = buildUpdateProductVariantRequest("prod-1", "var-1", makeVariant(), {
      inventoryLines: [],
    });

    expect(request).not.toHaveProperty("inventoryLines");
  });
});
