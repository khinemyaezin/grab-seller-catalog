import type { ProductFormValue } from "@/features/products/types";

export function isCatalogFormDirty(
  dirtyFields: Partial<Record<keyof ProductFormValue, unknown>>,
  extensionDirty: boolean,
): boolean {
  const { medias: _medias, descriptions: _descriptions, ...catalog } = dirtyFields;
  return Object.keys(catalog).length > 0 || extensionDirty;
}
