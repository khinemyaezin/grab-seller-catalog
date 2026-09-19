import type {
  ProductFormValue,
  UpdateSellableProductPublicationLine,
} from "@/features/products/types";
import { publicationTargetSkus } from "./publication-lines";

export type ProductPublicationDiff = {
  publicationLines: UpdateSellableProductPublicationLine[];
  unpublish: UpdateSellableProductPublicationLine[];
};

function lineKey(line: UpdateSellableProductPublicationLine): string {
  return `${line.sku}\0${line.salesChannelId}`;
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
  const currentSkus = new Set(publicationTargetSkus(values));
  const unpublish = seedLines.filter(
    (line) => !currentKeys.has(lineKey(line)) && currentSkus.has(line.sku),
  );

  return { publicationLines, unpublish };
}
