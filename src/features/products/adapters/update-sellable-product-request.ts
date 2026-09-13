import type {
  ProductFormValue,
  UpdateSellableProductRequest,
  UpdateProductContributions,
  UPDATE_INTENT,
} from "@/features/products/types";
import { buildUpdateProductRequest } from "./update-product-request";

export function buildUpdateSellableProductRequest(
  productId: string,
  values: ProductFormValue,
  intent: UPDATE_INTENT,
  contributions: UpdateProductContributions = {},
): UpdateSellableProductRequest {
  return {
    productId,
    product: buildUpdateProductRequest(values, intent),
    pricingLines: [],
    inventoryLines: [],
    ...contributions,
  };
}
