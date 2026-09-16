import { resolveUrlTemplate, type HateoasLink } from "@khinemyaezin/seller-api";
import {
  PRODUCT_OVERVIEW_DESCRIPTION_NAME,
  PRODUCT_OVERVIEW_DESCRIPTION_TITLE,
} from "@/features/products/lib/product-description";
import { catalogService } from "./catalog";
import type {
  ProductDescription,
  ReplaceProductDescriptionsRequest,
} from "@/features/products/types";

export type AttachProductDescriptionsOptions = {
  productId: string;
  items: ProductDescription[];
  seed?: ProductDescription[];
  replaceDescriptionsLink: HateoasLink;
};

export function toProductDescriptionFormItems(
  descriptions: ProductDescription[] | null | undefined,
): ProductDescription[] {
  return (descriptions ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    title: item.title,
    description: item.description,
  }));
}

function editableIndex(descriptions: ProductDescription[]): number {
  const overview = descriptions.findIndex(
    (item) => item.name === PRODUCT_OVERVIEW_DESCRIPTION_NAME,
  );
  if (overview >= 0) {
    return overview;
  }
  return descriptions.length > 0 ? 0 : -1;
}

export function overviewDescription(descriptions: ProductDescription[] | undefined): string {
  const items = descriptions ?? [];
  const index = editableIndex(items);
  return index >= 0 ? (items[index].description ?? "") : "";
}

export function withOverviewDescription(
  descriptions: ProductDescription[] | undefined,
  body: string,
): ProductDescription[] {
  const current = [...(descriptions ?? [])];
  const index = editableIndex(current);
  if (!body.trim()) {
    if (index >= 0) {
      current.splice(index, 1);
    }
    return current;
  }
  if (index >= 0) {
    current[index] = { ...current[index], description: body };
    return current;
  }
  return [
    ...current,
    {
      name: PRODUCT_OVERVIEW_DESCRIPTION_NAME,
      title: PRODUCT_OVERVIEW_DESCRIPTION_TITLE,
      description: body,
    },
  ];
}

export function toReplaceDescriptionsPayload(
  descriptions: ProductDescription[] | undefined,
): ReplaceProductDescriptionsRequest["descriptions"] {
  return (descriptions ?? [])
    .filter((item) => item.name.trim().length > 0 && item.description.trim().length > 0)
    .map((item) => ({
      ...(item.id ? { id: item.id } : {}),
      name: item.name,
      ...(item.title ? { title: item.title } : {}),
      description: item.description,
    }));
}

export function isDescriptionsDirty(
  items: ProductDescription[] | undefined,
  seed: ProductDescription[] | undefined = [],
): boolean {
  return JSON.stringify(toReplaceDescriptionsPayload(items))
    !== JSON.stringify(toReplaceDescriptionsPayload(seed));
}

export async function attachProductDescriptions({
  productId,
  items,
  seed = [],
  replaceDescriptionsLink,
}: AttachProductDescriptionsOptions): Promise<void> {
  if (!isDescriptionsDirty(items, seed)) {
    return;
  }

  await catalogService.replaceProductDescriptions(
    resolveUrlTemplate({ productId }, replaceDescriptionsLink),
    { descriptions: toReplaceDescriptionsPayload(items) },
  );
}
