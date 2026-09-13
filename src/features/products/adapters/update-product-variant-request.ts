import type {
  ProductVariantForm,
  UpdateProductContributions,
  UpdateProductVariantPrice,
  UpdateProductVariantRequest,
  UpdateSellableProductPricingLine,
} from "@/features/products/types";

export function buildUpdateProductVariantRequest(
  productId: string,
  variantId: string,
  variant: ProductVariantForm,
  contributions: UpdateProductContributions = {},
): UpdateProductVariantRequest {
  const price = toVariantPrice(variant.sku, contributions.pricingLines);
  const inventoryLines = contributions.inventoryLines?.length
    ? contributions.inventoryLines
    : undefined;

  return {
    productId,
    variantId,
    sku: variant.sku,
    manageInventory: variant.manageInventory === true,
    ...(price ? { price } : {}),
    ...(inventoryLines ? { inventoryLines } : {}),
  };
}

function toVariantPrice(
  sku: string,
  pricingLines: UpdateSellableProductPricingLine[] | undefined,
): UpdateProductVariantPrice | undefined {
  if (!pricingLines?.length) {
    return undefined;
  }

  const line =
    pricingLines.find((pricingLine) => pricingLine.sku === sku) ?? pricingLines[0];

  if (!line) {
    return undefined;
  }

  return {
    ...(line.title ? { title: line.title } : {}),
    currencyCode: line.currencyCode,
    amount: line.amount,
    ...(line.minQuantity != null ? { minQuantity: line.minQuantity } : {}),
    ...(line.maxQuantity != null ? { maxQuantity: line.maxQuantity } : {}),
    ...(line.rules?.length ? { rules: line.rules } : {}),
  };
}
