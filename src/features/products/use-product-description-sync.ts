import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { resolveLink, type HateoasLink } from "@khinemyaezin/seller-api";
import {
  attachProductDescriptions,
  isDescriptionsDirty,
} from "@/features/products/api/product-descriptions";
import type { ProductDescription, ProductFormValue } from "@/features/products/types";
import { useCatalogLink } from "@/features/products/api/use-root";

export type ProductDescriptionSyncResult =
  | { status: "skipped" }
  | { status: "synced" }
  | { status: "failed"; error: Error };

export type UseProductDescriptionSyncOptions = {
  seed?: ProductDescription[];
  actions?: Record<string, HateoasLink>;
};

export type UseProductDescriptionSyncResult = {
  attach: (productId: string) => Promise<ProductDescriptionSyncResult>;
};

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

const EMPTY_SEED: ProductDescription[] = [];

export function useProductDescriptionSync({
  seed = EMPTY_SEED,
  actions,
}: UseProductDescriptionSyncOptions = {}): UseProductDescriptionSyncResult {
  const { getValues } = useFormContext<ProductFormValue>();
  const rootReplaceLink = useCatalogLink("replaceProductDescriptions");

  const attach = useCallback(
    async (productId: string): Promise<ProductDescriptionSyncResult> => {
      const items = getValues("descriptions") ?? [];
      if (!isDescriptionsDirty(items, seed)) {
        return { status: "skipped" };
      }

      const replaceDescriptionsLink =
        resolveLink(actions, "replace-product-descriptions") ?? rootReplaceLink;

      if (!replaceDescriptionsLink) {
        return { status: "failed", error: new Error("Missing description links") };
      }

      try {
        await attachProductDescriptions({
          productId,
          items,
          seed,
          replaceDescriptionsLink,
        });
        return { status: "synced" };
      } catch (error) {
        return { status: "failed", error: toError(error) };
      }
    },
    [actions, getValues, rootReplaceLink, seed],
  );

  return { attach };
}
