import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  collectSlotFieldErrors,
  mergeContributions,
  useValidateAllSlots,
} from "@khinemyaezin/seller-ui";
import { PRODUCT_CONTRIBUTION_SLICES } from "@khinemyaezin/seller-contracts";
import { resolveLink, type HateoasLink } from "@khinemyaezin/seller-api";
import { invalidateProductQueries } from "@/features/products/api/use-products";
import { attachVariantMedia } from "@/features/products/api/variant-media";
import { buildUpdateProductVariantRequest } from "@/features/products/lib/update-product-variant-request";
import {
  runWorkflowChain,
  toWorkflowStepResult,
} from "@/features/products/lib/run-workflow-chain";
import type {
  ProductLifecycleEvent,
  ProductVariantForm,
  UpdateProductContributions,
} from "@/features/products/types";
import { WorkflowTimeoutError } from "@/features/products/use-workflow-awaiter";
import { useUpdateProductVariantCommand } from "./use-product-variant-update-command";

const PRODUCT_SLICES = [
  PRODUCT_CONTRIBUTION_SLICES.PRICING_LINES,
  PRODUCT_CONTRIBUTION_SLICES.INVENTORY_LINES,
] as const;

export type UseProductVariantUpdateSubmitOptions = {
  productId: string;
  variantId: string;
  seed: ProductVariantForm;
  actions?: Record<string, HateoasLink>;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export type UseProductVariantUpdateSubmitResult = {
  submit: () => Promise<void>;
};

type VariantUpdateChainCtx = {
  entityUpdated: boolean;
};

export function useProductVariantUpdateSubmit({
  productId,
  variantId,
  seed,
  actions,
  onLifecycleEvent,
}: UseProductVariantUpdateSubmitOptions): UseProductVariantUpdateSubmitResult {
  const queryClient = useQueryClient();
  const { getValues } = useFormContext<ProductVariantForm>();
  const { validate } = useValidateAllSlots();
  const { execute, reset: resetCommand, link } = useUpdateProductVariantCommand();

  const submit = useCallback(async () => {
    if (!link) {
      throw new Error("Missing update link");
    }

    const results = await validate();
    const errors = collectSlotFieldErrors(results);

    if (results.some((result) => !result.valid)) {
      onLifecycleEvent?.({ type: "validationFailed", errors });
      throw new Error("Validation failed");
    }

    const values = getValues();
    const contributions = mergeContributions(results, PRODUCT_SLICES) as UpdateProductContributions;
    const payload = buildUpdateProductVariantRequest(
      productId,
      variantId,
      values,
      contributions,
    );
    const batchLink = resolveLink(actions, "batch-variant-images");

    const chain = await runWorkflowChain<VariantUpdateChainCtx>(
      [
        {
          id: "updateEntity",
          run: async () => {
            await execute(payload);
            return { status: "ok", patch: { entityUpdated: true } };
          },
          onFailure: "abort",
        },
        {
          id: "attachVariantMedia",
          run: async () => toWorkflowStepResult(await attachVariantMedia({
            link: batchLink,
            mediaIds: values.mediaIds ?? [],
            thumbnailMediaId: values.thumbnailMediaId,
            seedMediaIds: seed.mediaIds ?? [],
            seedThumbnailMediaId: seed.thumbnailMediaId,
          })),
          onFailure: (ctx) => ctx.entityUpdated ? "stop" : "abort",
        },
      ],
      { entityUpdated: false },
    );

    if (chain.status === "aborted") {
      const error = chain.error ?? new Error("Workflow aborted");
      resetCommand();
      if (chain.failedStepId === "updateEntity") {
        if (error instanceof WorkflowTimeoutError) {
          onLifecycleEvent?.({ type: "updateTimedOut" });
        } else {
          onLifecycleEvent?.({ type: "updateFailed" });
        }
      } else if (chain.failedStepId === "attachVariantMedia") {
        onLifecycleEvent?.({ type: "updateMediaFailed" });
      }
      throw error;
    }

    if (chain.status === "stopped") {
      if (chain.failedStepId === "attachVariantMedia") {
        onLifecycleEvent?.({ type: "updateMediaFailed" });
      }
      void invalidateProductQueries(queryClient, productId);
      resetCommand();
      return;
    }

    void invalidateProductQueries(queryClient, productId);
    onLifecycleEvent?.({ type: "updated" });
    resetCommand();
  }, [
    actions,
    execute,
    getValues,
    link,
    onLifecycleEvent,
    productId,
    queryClient,
    resetCommand,
    seed.mediaIds,
    seed.thumbnailMediaId,
    validate,
    variantId,
  ]);

  return {
    submit,
  };
}
