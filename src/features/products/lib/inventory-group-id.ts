export const STANDALONE_INVENTORY_GROUP_ID = "product.create.inventory:standalone";
export const STANDALONE_INVENTORY_EDIT_GROUP_ID = "product.edit.inventory:standalone";

export function inventoryGroupId(matrixKey: string): string {
  return `product.create.inventory:${matrixKey}`;
}

export function inventoryEditGroupId(matrixKey: string): string {
  return `product.edit.inventory:${matrixKey}`;
}
