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
import type { HateoasLink } from "@khinemyaezin/seller-api";
import { invalidateProductQueries } from "@/features/products/api/use-products";
import { useUpdateSellableProductCommand } from "./use-product-update-command";
import { isCatalogFormDirty } from "@/features/products/lib/product-form-dirty";
import { determineUpdateIntent } from "@/features/products/lib/update-product-request";
import { buildUpdateSellableProductRequest } from "@/features/products/lib/update-sellable-product-request";
import {
  isWorkflowChainIdle,
  runWorkflowChain,
  toWorkflowStepResult,
} from "@/features/products/lib/run-workflow-chain";
import type {
  ProductFormValue,
  ProductLifecycleEvent,
  UpdateProductContributions,
  UpdateSellableProductRequest,
} from "@/features/products/types";
import { useProductDescriptionSync } from "@/features/products/use-product-description-sync";
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

function secondaryFailureEvent(stepId: string | undefined): ProductLifecycleEvent | undefined {
  if (stepId === "stageMedia" || stepId === "attachMedia") {
    return { type: "updateMediaFailed" };
  }
  if (stepId === "attachDescriptions") {
    return { type: "updateDescriptionFailed" };
  }
  return undefined;
}

export function useProductUpdateSubmit({
  productId,
  seed,
  actions,
  onLifecycleEvent,
}: UseProductUpdateSubmitOptions): UseProductUpdateSubmitResult {
  const queryClient = useQueryClient();
  const { getValues, formState: { dirtyFields } } = useFormContext<ProductFormValue>();
  const [extensionDirty] = useIsExtensionDirty();
  const { validate } = useValidateAllSlots();
  const { stage, attach } = useProductMediaSync({ seed: seed.medias, actions });
  const { attach: attachDescriptions } = useProductDescriptionSync({
    seed: seed.descriptions,
    actions,
  });
  const { execute, reset: resetCommand } = useUpdateSellableProductCommand();

  const submit = useCallback(async () => {
    const catalogDirty = isCatalogFormDirty(dirtyFields, extensionDirty);

    let payload: UpdateSellableProductRequest | undefined;
    if (catalogDirty) {
      const results = await validate();
      const errors = collectSlotFieldErrors(results);
      if (results.some((result) => !result.valid)) {
        onLifecycleEvent?.({ type: "validationFailed", errors });
        throw new Error("Validation failed");
      }

      const values = getValues();
      const intent = determineUpdateIntent({
        hasVariationTypes: values.variationTypes.length > 0,
      });
      const contributions = mergeContributions(
        results,
        PRODUCT_SLICES,
      ) as UpdateProductContributions;
      payload = buildUpdateSellableProductRequest(
        productId,
        values,
        intent,
        contributions,
      );
    }

    const onSecondaryFailure = (ctx: ProductUpdateChainCtx) =>
      ctx.entityUpdated ? "stop" : "abort";

    const chain = await runWorkflowChain<ProductUpdateChainCtx>(
      [
        {
          id: "updateEntity",
          run: async () => {
            if (!payload) {
              return { status: "skipped" };
            }
            await execute(payload);
            return { status: "ok", patch: { entityUpdated: true } };
          },
          onFailure: "abort",
        },
        {
          id: "stageMedia",
          run: async () => toWorkflowStepResult(await stage()),
          onFailure: onSecondaryFailure,
        },
        {
          id: "attachMedia",
          run: async (ctx) => toWorkflowStepResult(await attach(ctx.productId)),
          onFailure: onSecondaryFailure,
        },
        {
          id: "attachDescriptions",
          run: async (ctx) => toWorkflowStepResult(await attachDescriptions(ctx.productId)),
          onFailure: onSecondaryFailure,
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
      const event = secondaryFailureEvent(chain.failedStepId);
      if (event) {
        onLifecycleEvent?.(event);
      }
      throw error;
    }

    if (chain.status === "stopped") {
      const event = secondaryFailureEvent(chain.failedStepId);
      if (event) {
        onLifecycleEvent?.(event);
      }
      void invalidateProductQueries(queryClient, productId);
      resetCommand();
      return;
    }

    if (isWorkflowChainIdle(chain)) {
      return;
    }

    void invalidateProductQueries(queryClient, productId);
    onLifecycleEvent?.({ type: "updated" });
    resetCommand();
  }, [
    attach,
    attachDescriptions,
    dirtyFields,
    execute,
    extensionDirty,
    getValues,
    onLifecycleEvent,
    productId,
    queryClient,
    resetCommand,
    stage,
    validate,
  ]);

  return {
    submit,
  };
}
