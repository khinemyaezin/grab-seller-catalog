import { isStandaloneProductForm } from "./is-standalone-product-form";
import type {
  UpdateSellableProductPublicationLine,
  Variant,
  VariationType,
} from "@/features/products/types";

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    next.push(value);
  }
  return next;
}

export function matrixPublicationSkus(variants: Variant[] | undefined): string[] {
  return unique(
    (variants ?? [])
      .filter((variant) => (variant.variations?.length ?? 0) > 0)
      .map((variant) => variant.sku?.trim() ?? ""),
  );
}

export function publicationTargetSkus(values: {
  variationTypes?: VariationType[] | null;
  product: {
    standaloneVariant?: { sku?: string };
    variants?: Variant[];
  };
}): string[] {
  if (isStandaloneProductForm(values.variationTypes)) {
    const sku = values.product.standaloneVariant?.sku?.trim() ?? "";
    return sku ? [sku] : [];
  }
  return matrixPublicationSkus(values.product.variants);
}

export function unionChannelIds(
  lines: UpdateSellableProductPublicationLine[] | undefined,
  skus: string[],
): string[] {
  const skuSet = new Set(skus);
  return unique(
    (lines ?? [])
      .filter((line) => skuSet.has(line.sku))
      .map((line) => line.salesChannelId),
  );
}

export function channelPublishedOnAllSkus(
  lines: UpdateSellableProductPublicationLine[] | undefined,
  skus: string[],
  channelId: string,
): boolean {
  if (skus.length === 0) {
    return false;
  }
  const current = lines ?? [];
  return skus.every((sku) =>
    current.some((line) => line.sku === sku && line.salesChannelId === channelId),
  );
}

export function togglePublicationChannelForSkus(
  lines: UpdateSellableProductPublicationLine[] | undefined,
  skus: string[],
  channelId: string,
  currentlyPublished: boolean,
): UpdateSellableProductPublicationLine[] {
  const targets = unique(skus.map((sku) => sku.trim()));
  if (targets.length === 0) {
    return lines ?? [];
  }

  const current = lines ?? [];
  const skuSet = new Set(targets);

  if (currentlyPublished) {
    return current.filter(
      (line) => !(skuSet.has(line.sku) && line.salesChannelId === channelId),
    );
  }

  const next = [...current];
  for (const sku of targets) {
    if (!next.some((line) => line.sku === sku && line.salesChannelId === channelId)) {
      next.push({ sku, salesChannelId: channelId });
    }
  }
  return next;
}

export function syncPublicationLinesForMatrixVariants(
  lines: UpdateSellableProductPublicationLine[] | undefined,
  standaloneSku: string,
  matrixSkus: string[],
): UpdateSellableProductPublicationLine[] {
  const current = lines ?? [];
  const targets = unique(matrixSkus.map((sku) => sku.trim()));
  if (targets.length === 0) {
    return current;
  }

  const sourceSku = standaloneSku.trim();
  const standaloneChannels = unique(
    current
      .filter((line) => sourceSku && line.sku === sourceSku)
      .map((line) => line.salesChannelId),
  );
  const existingTargetChannels = unique(
    current
      .filter((line) => targets.includes(line.sku))
      .map((line) => line.salesChannelId),
  );
  const sourceChannels = standaloneChannels.length > 0
    ? standaloneChannels
    : existingTargetChannels;

  const next = current.filter((line) => targets.includes(line.sku));

  for (const sku of targets) {
    const skuHasAny = next.some((line) => line.sku === sku);
    if (skuHasAny) {
      continue;
    }
    for (const channelId of sourceChannels) {
      next.push({ sku, salesChannelId: channelId });
    }
  }

  return next;
}

export function collapsePublicationLinesToStandalone(
  lines: UpdateSellableProductPublicationLine[] | undefined,
  standaloneSku: string,
): UpdateSellableProductPublicationLine[] {
  const sku = standaloneSku.trim();
  if (!sku) {
    return lines ?? [];
  }
  const channelIds = unique((lines ?? []).map((line) => line.salesChannelId));
  return channelIds.map((salesChannelId) => ({ sku, salesChannelId }));
}
