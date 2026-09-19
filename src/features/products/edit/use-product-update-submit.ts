import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { PRODUCT_CONTRIBUTION_SLICES } from "@khinemyaezin/seller-contracts";
import {
  collectSlotFieldErrors,
  mergeContributions,
  useIsExtensionDirty,
  useValidateAllSlots,
} from "@khinemyaezin/seller-ui";
import { type HateoasLink } from "@khinemyaezin/seller-api";
import { isDescriptionsDirty, toReplaceDescriptionsPayload } from "@/features/products/api/product-descriptions";
import { isGalleryDirty, toReplaceMediaPayload } from "@/features/products/api/product-media";
import { invalidateProductQueries } from "@/features/products/api/use-products";
import { useUpdateSellableProductCommand } from "./use-product-update-command";
import { isCatalogFormDirty } from "@/features/products/lib/product-form-dirty";
import { determineUpdateIntent } from "@/features/products/lib/update-product-request";
import { buildUpdateSellableProductRequest } from "@/features/products/lib/update-sellable-product-request";
import { diffProductPublications } from "@/features/products/lib/diff-product-publications";
import {
  isWorkflowChainIdle,
  runWorkflowChain,
  toWorkflowStepResult,
} from "@/features/products/lib/run-workflow-chain";
import type {
  ProductFormValue,
  ProductLifecycleEvent,
  UpdateProductContributions,
} from "@/features/products/types";
import { useProductMediaSync } from "@/features/products/use-product-media-sync";
import { WorkflowTimeoutError } from "@/features/products/use-workflow-awaiter";

const PRODUCT_SLICES = [
  PRODUCT_CONTRIBUTION_SLICES.PRICING_LINES,
  PRODUCT_CONTRIBUTION_SLICES.INVENTORY_LINES,
] as const;

export type UseProductUpdateSubmitOptions = {
  productId: string;
  seed: ProductFormValue;
  actions?: Record<string, HateoasLink>;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export type UseProductUpdateSubmitResult = {
  submit: () => Promise<void>;
};

type ProductUpdateChainCtx = {
  productId: string;
  entityUpdated: boolean;
};

export function useProductUpdateSubmit({
  productId,
  seed,
  onLifecycleEvent,
}: UseProductUpdateSubmitOptions): UseProductUpdateSubmitResult {
  const queryClient = useQueryClient();
  const { getValues, formState: { dirtyFields } } = useFormContext<ProductFormValue>();
  const [extensionDirty] = useIsExtensionDirty();
  const { validate } = useValidateAllSlots();
  const { stage } = useProductMediaSync();
  const { execute, reset: resetCommand } = useUpdateSellableProductCommand();

  const submit = useCallback(async () => {
    const catalogDirty = isCatalogFormDirty(dirtyFields, extensionDirty);
    const current = getValues();
    const mediaDirty = isGalleryDirty(current.medias ?? [], seed.medias ?? []);
    const descriptionsDirty = isDescriptionsDirty(current.descriptions ?? [], seed.descriptions ?? []);
    const shouldUpdate = catalogDirty || mediaDirty || descriptionsDirty;

    let slotContributions: UpdateProductContributions = {};
    if (catalogDirty) {
      const results = await validate();
      const errors = collectSlotFieldErrors(results);
      if (results.some((result) => !result.valid)) {
        onLifecycleEvent?.({ type: "validationFailed", errors });
        throw new Error("Validation failed");
      }
      slotContributions = mergeContributions(
        results,
        PRODUCT_SLICES,
      ) as UpdateProductContributions;
    }

    const chain = await runWorkflowChain<ProductUpdateChainCtx>(
      [
        {
          id: "stageMedia",
          run: async () => toWorkflowStepResult(await stage()),
          onFailure: "abort",
        },
        {
          id: "updateEntity",
          run: async () => {
            if (!shouldUpdate) {
              return { status: "skipped" };
            }
            const values = getValues();
            const intent = determineUpdateIntent({
              hasVariationTypes: values.variationTypes.length > 0,
            });
            const publicationDiff = catalogDirty
              ? diffProductPublications(seed, values)
              : { publicationLines: [], unpublish: [] };
            const activating = seed.product.status !== "ACTIVE" && values.product.status === "ACTIVE";
            const publicationLines = activating
              ? (values.product.publicationLines ?? [])
              : publicationDiff.publicationLines;
            const unpublishLines = activating ? [] : publicationDiff.unpublish;

            await execute(buildUpdateSellableProductRequest(
              productId,
              values,
              intent,
              {
                ...slotContributions,
                ...(publicationLines.length > 0 ? { publicationLines } : {}),
                ...(unpublishLines.length > 0 ? { unpublishLines } : {}),
                ...(mediaDirty ? { medias: toReplaceMediaPayload(values.medias ?? []) } : {}),
                ...(descriptionsDirty
                  ? { descriptions: toReplaceDescriptionsPayload(values.descriptions) }
                  : {}),
              },
            ));
            return { status: "ok", patch: { entityUpdated: true } };
          },
          onFailure: "abort",
        },
      ],
      { productId, entityUpdated: false },
    );

    if (chain.status === "aborted") {
      const error = chain.error ?? new Error("Workflow aborted");
      if (chain.failedStepId === "updateEntity") {
        resetCommand();
        if (error instanceof WorkflowTimeoutError) {
          onLifecycleEvent?.({ type: "updateTimedOut" });
        } else {
          onLifecycleEvent?.({ type: "updateFailed" });
        }
        throw error;
      }
      if (chain.failedStepId === "stageMedia") {
        onLifecycleEvent?.({ type: "updateMediaFailed" });
      }
      throw error;
    }

    if (isWorkflowChainIdle(chain)) {
      return;
    }

    void invalidateProductQueries(queryClient, productId);
    onLifecycleEvent?.({ type: "updated" });
    resetCommand();
  }, [
    dirtyFields,
    execute,
    extensionDirty,
    getValues,
    onLifecycleEvent,
    productId,
    queryClient,
    resetCommand,
    seed,
    stage,
    validate,
  ]);

  return {
    submit,
  };
}
