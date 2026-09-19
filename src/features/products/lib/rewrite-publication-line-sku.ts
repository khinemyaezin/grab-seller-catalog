import type { UpdateSellableProductPublicationLine } from "@/features/products/types";

export function rewritePublicationLineSku(
  lines: UpdateSellableProductPublicationLine[] | undefined,
  fromSku: string,
  toSku: string,
): UpdateSellableProductPublicationLine[] {
  const current = lines ?? [];
  if (!fromSku || fromSku === toSku) {
    return current;
  }
  return current.map((line) =>
    line.sku === fromSku ? { ...line, sku: toSku } : line,
  );
}
