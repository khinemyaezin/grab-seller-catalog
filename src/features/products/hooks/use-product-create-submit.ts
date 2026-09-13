import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import type { HateoasLink } from "@khinemyaezin/seller-api";
import { useQueryClient } from "@tanstack/react-query";
import {
  collectSlotFieldErrors,
  mergeContributions,
  useValidateAllSlots,
} from "@khinemyaezin/seller-ui";
import { PRODUCT_CONTRIBUTION_SLICES } from "@khinemyaezin/seller-contracts";
import {
  useCreateSellableProductMutation,
  invalidateProductsQueries,
} from "@/features/products/hooks/use-products";
import { buildCreateSellableProductRequest } from "@/features/products/adapters/create-sellable-product-request";
import type {
  ProductContributions,
  ProductFormValue,
  ProductLifecycleEvent,
} from "@/features/products/types";
import { CREATE_SELLABLE_PRODUCT_WORKFLOW } from "@/features/products/constants/create-sellable-product-workflow";
import {
  useWorkflowAwaiter,
  WorkflowTimeoutError,
} from "@/features/products/hooks/use-workflow-awaiter";

const PRODUCT_SLICES = [
  PRODUCT_CONTRIBUTION_SLICES.PRICING_LINES,
  PRODUCT_CONTRIBUTION_SLICES.INVENTORY_LINES,
] as const;

export type UseProductCreateSubmitOptions = {
  link: HateoasLink;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
  onSuccess?: () => void
};

export type UseProductCreateSubmitResult = {
  submit: () => Promise<void>;
};

export function useProductCreateSubmit({
  link,
  onLifecycleEvent,
  onSuccess
}: UseProductCreateSubmitOptions): UseProductCreateSubmitResult {
  const queryClient = useQueryClient();
  const { getValues } = useFormContext<ProductFormValue>();
  const { validate } = useValidateAllSlots();
  const mutation = useCreateSellableProductMutation();
  const { mutateAsync, reset: resetMutation } = mutation;

  const { awaitWorkflow } = useWorkflowAwaiter({
    workflowName: CREATE_SELLABLE_PRODUCT_WORKFLOW,
  });

  const submit = useCallback(async () => {
    const results = await validate();
    const errors = collectSlotFieldErrors(results);

    if (results.some((result) => !result.valid)) {
      onLifecycleEvent?.({ type: "validationFailed", errors });
      throw new Error("Validation failed");
    }

    const contributions = mergeContributions(results, PRODUCT_SLICES) as ProductContributions;
    const payload = buildCreateSellableProductRequest(getValues(), contributions);

    try {
      await awaitWorkflow((idempotencyKey) =>
        mutateAsync({
          link,
          request: { ...payload, idempotencyKey },
        }),
      );
      void invalidateProductsQueries(queryClient);
      onLifecycleEvent?.({ type: "created" });
      resetMutation();
      onSuccess?.();
    } catch (error) {
      resetMutation();
      if (error instanceof WorkflowTimeoutError) {
        onLifecycleEvent?.({ type: "createTimedOut" });
      } else {
        onLifecycleEvent?.({ type: "createFailed" });
      }
      throw error;
    }
  }, [
    awaitWorkflow,
    getValues,
    link,
    mutateAsync,
    onLifecycleEvent,
    onSuccess,
    queryClient,
    resetMutation,
    validate,
  ]);

  return {
    submit,
  };
}
