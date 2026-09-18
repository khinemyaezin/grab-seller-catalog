import type {
  ProductFormValue,
  UpdateSellableProductPublicationLine,
} from "@/features/products/types";
import { isStandaloneProductForm } from "./is-standalone-product-form";

export type UnpublishProductTarget = {
  variantId: string;
  salesChannelId: string;
};

export type ProductPublicationDiff = {
  publicationLines: UpdateSellableProductPublicationLine[];
  unpublish: UnpublishProductTarget[];
};

function lineKey(line: UpdateSellableProductPublicationLine): string {
  return `${line.sku}\0${line.salesChannelId}`;
}

function seedVariantIdForSku(seed: ProductFormValue, sku: string): string | undefined {
  if (isStandaloneProductForm(seed.variationTypes)) {
    const standalone = seed.product.standaloneVariant;
    return standalone.sku === sku ? standalone.id : undefined;
  }
  return seed.product.variants.find((variant) => variant.sku === sku)?.id;
}

export function diffProductPublications(
  seed: ProductFormValue,
  values: ProductFormValue,
): ProductPublicationDiff {
  const seedLines = seed.product.publicationLines ?? [];
  const currentLines = values.product.publicationLines ?? [];
  const seedKeys = new Set(seedLines.map(lineKey));
  const currentKeys = new Set(currentLines.map(lineKey));

  const publicationLines = currentLines.filter((line) => !seedKeys.has(lineKey(line)));
  const unpublish: UnpublishProductTarget[] = [];

  for (const line of seedLines) {
    if (currentKeys.has(lineKey(line))) {
      continue;
    }
    const variantId = seedVariantIdForSku(seed, line.sku);
    if (!variantId) {
      continue;
    }
    unpublish.push({ variantId, salesChannelId: line.salesChannelId });
  }

  return { publicationLines, unpublish };
}
