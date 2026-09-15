export function isCatalogFormDirty(
  dirtyFields: Partial<{ product?: unknown; variationTypes?: unknown }>,
  extensionDirty: boolean,
): boolean {
  return Boolean(dirtyFields.product || dirtyFields.variationTypes || extensionDirty);
}
