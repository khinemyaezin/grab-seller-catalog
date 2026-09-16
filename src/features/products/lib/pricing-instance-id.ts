export const STANDALONE_PRICING_INSTANCE_ID = "product.create.pricing:standalone";
export const STANDALONE_PRICING_EDIT_GROUP_ID = "product.edit.pricing:standalone";

export function pricingInstanceId(matrixKey: string): string {
  return `product.create.pricing:${matrixKey}`;
}

export function pricingEditGroupId(matrixKey: string): string {
  return `product.edit.pricing:${matrixKey}`;
}
