import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { resolveLink, type HateoasLink } from "@khinemyaezin/seller-api";
import {
  attachProductMedia,
  isGalleryDirty,
  stageProductMedia,
} from "@/features/products/api/product-media";
import type { ProductFormValue, ProductMediaFormItem } from "@/features/products/types";
import { useCatalogLink } from "./use-root";

export type ProductMediaSyncResult =
  | { status: "skipped" }
  | { status: "synced" }
  | { status: "failed"; error: Error };

export type UseProductMediaSyncOptions = {
  seed?: ProductMediaFormItem[];
  actions?: Record<string, HateoasLink>;
};

export type UseProductMediaSyncResult = {
  stage: () => Promise<ProductMediaSyncResult>;
  attach: (productId: string) => Promise<ProductMediaSyncResult>;
};

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

const EMPTY_SEED: ProductMediaFormItem[] = [];

export function useProductMediaSync({
  seed = EMPTY_SEED,
  actions,
}: UseProductMediaSyncOptions = {}): UseProductMediaSyncResult {
  const { getValues, setValue } = useFormContext<ProductFormValue>();
  const rootUploadLink = useCatalogLink("createStagedMediaUpload");
  const rootReplaceLink = useCatalogLink("replaceProductMedia");

  const patchItem = useCallback(
    (id: string, patch: Partial<ProductMediaFormItem>) => {
      setValue(
        "medias",
        getValues("medias").map((item) => (item.id === id ? { ...item, ...patch } : item)),
        { shouldDirty: true, shouldValidate: false },
      );
    },
    [getValues, setValue],
  );

  const stage = useCallback(
    async (): Promise<ProductMediaSyncResult> => {
      const items = getValues("medias") ?? [];
      const drafts = items.filter((item) => item.file && !item.storageKey);
      if (drafts.length === 0) {
        return { status: "skipped" };
      }

      if (!rootUploadLink) {
        return { status: "failed", error: new Error("Missing media links") };
      }

      try {
        await stageProductMedia({
          items,
          createUploadLink: rootUploadLink,
          onItemStatus: (id, status, error) => {
            patchItem(id, { status, error });
          },
          onStaged: (id, storageKey) => {
            patchItem(id, { storageKey, status: "done" });
          },
        });
        return { status: "synced" };
      } catch (error) {
        return { status: "failed", error: toError(error) };
      }
    }, [getValues, patchItem, rootUploadLink]
  );

  const attach = useCallback(
    async (productId: string): Promise<ProductMediaSyncResult> => {
      const items = getValues("medias") ?? [];
      if (!isGalleryDirty(items, seed)) {
        return { status: "skipped" };
      }

      const replaceMediaLink =
        resolveLink(actions, "replace-product-media") ?? rootReplaceLink;

      if (!replaceMediaLink) {
        return { status: "failed", error: new Error("Missing media links") };
      }

      try {
        await attachProductMedia({
          productId,
          items,
          seed,
          replaceMediaLink,
        });
        return { status: "synced" };
      } catch (error) {
        return { status: "failed", error: toError(error) };
      }
    },
    [actions, getValues, rootReplaceLink, seed],
  );

  return { stage, attach };
}
