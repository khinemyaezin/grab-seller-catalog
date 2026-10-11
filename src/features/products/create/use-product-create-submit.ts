import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { type HateoasLink } from "@khinemyaezin/seller-api";
import { PRODUCT_CONTRIBUTION_SLICES } from "@khinemyaezin/seller-contracts";
import { collectSlotFieldErrors, mergeContributions, useValidateAllSlots } from "@khinemyaezin/seller-ui";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateProductQueries } from "@/features/products/api/use-products";
import { useCreateSellableProductCommand } from "./use-product-create-command";
import { buildCreateSellableProductRequest } from "@/features/products/lib/create-sellable-product-request";
import {
  runWorkflowChain,
  toWorkflowStepResult,
} from "@/features/products/lib/run-workflow-chain";
import type {
  ProductContributions,
  ProductFormValue,
  ProductLifecycleEvent,
} from "@/features/products/types";
import { useProductMediaSync } from "@/features/products/use-product-media-sync";
import { WorkflowTimeoutError } from "@/features/products/use-workflow-awaiter";

const PRODUCT_SLICES = [
  PRODUCT_CONTRIBUTION_SLICES.PRICING_LINES,
  PRODUCT_CONTRIBUTION_SLICES.INVENTORY_LINES,
] as const;

export type UseProductCreateSubmitOptions = {
  link: HateoasLink;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export type UseProductCreateSubmitResult = {
  submit: () => Promise<void>;
};

type ProductCreateChainCtx = {
  productId?: string;
};

export function useProductCreateSubmit({
  link,
  onLifecycleEvent,
}: UseProductCreateSubmitOptions): UseProductCreateSubmitResult {
  const queryClient = useQueryClient();
  const { getValues } = useFormContext<ProductFormValue>();
  const { validate } = useValidateAllSlots();
  const { execute, reset: resetCommand } = useCreateSellableProductCommand(link);
  const { stage } = useProductMediaSync();

  const submit = useCallback(async () => {
    const results = await validate();
    const errors = collectSlotFieldErrors(results);
    if (results.some((result) => !result.valid)) {
      onLifecycleEvent?.({ type: "validationFailed", errors });
      throw new Error("Validation failed");
    }

    const chain = await runWorkflowChain<ProductCreateChainCtx>(
      [
        {
          id: "stageMedia",
          run: async () => toWorkflowStepResult(await stage()),
          onFailure: "abort",
        },
        {
          id: "createEntity",
          run: async () => {
            const contributions = mergeContributions(results, PRODUCT_SLICES) as ProductContributions;
            const payload = buildCreateSellableProductRequest(getValues(), contributions);
            const commandResult = await execute(payload);
            return { status: "ok" as const, patch: { productId: commandResult.productId } };
          },
          onFailure: "abort",
        },
      ],
      {},
    );

    if (chain.status === "aborted") {
      const error = chain.error ?? new Error("Workflow aborted");
      if (chain.failedStepId === "createEntity") {
        resetCommand();
        if (error instanceof WorkflowTimeoutError) {
          onLifecycleEvent?.({ type: "createTimedOut" });
        } else {
          onLifecycleEvent?.({ type: "createFailed" });
        }
      }
      throw error;
    }

    const productId = chain.ctx.productId;
    if (!productId) {
      throw new Error("Missing productId");
    }

    onLifecycleEvent?.({ type: "created", productId });
    void invalidateProductQueries(queryClient, productId);
  }, [
    execute,
    getValues,
    onLifecycleEvent,
    queryClient,
    resetCommand,
    stage,
    validate,
  ]);

  return { submit };
}
