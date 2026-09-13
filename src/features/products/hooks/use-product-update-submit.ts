import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  collectSlotFieldErrors,
  mergeContributions,
  useValidateAllSlots,
} from "@khinemyaezin/seller-ui";
import { PRODUCT_CONTRIBUTION_SLICES } from "@khinemyaezin/seller-contracts";
import {
  useUpdateSellableProductMutation,
  invalidateProductQueries,
} from "@/features/products/hooks/use-products";
import { buildUpdateSellableProductRequest } from "@/features/products/adapters/update-sellable-product-request";
import { determineUpdateIntent } from "@/features/products/adapters/update-product-request";
import type {
  ProductFormValue,
  ProductLifecycleEvent,
  UpdateProductContributions,
} from "@/features/products/types";
import { UPDATE_SELLABLE_PRODUCT_WORKFLOW } from "@/features/products/constants/create-sellable-product-workflow";
import {
  useWorkflowAwaiter,
  WorkflowTimeoutError,
} from "@/features/products/hooks/use-workflow-awaiter";
import { useCatalogLink } from "./use-root";

const PRODUCT_SLICES = [
  PRODUCT_CONTRIBUTION_SLICES.PRICING_LINES,
  PRODUCT_CONTRIBUTION_SLICES.INVENTORY_LINES,
] as const;

export type UseProductUpdateSubmitOptions = {
  productId: string;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
  refetch?: () => void;
};

export type UseProductUpdateSubmitResult = {
  submit: () => Promise<void>;
};

export function useProductUpdateSubmit({
  productId,
  onLifecycleEvent,
  refetch,
}: UseProductUpdateSubmitOptions): UseProductUpdateSubmitResult {
  const queryClient = useQueryClient();
  const { getValues } = useFormContext<ProductFormValue>();
  const productUpdateLink = useCatalogLink("updateSellableProduct");

  const { validate } = useValidateAllSlots();
  const mutation = useUpdateSellableProductMutation();
  const { mutateAsync, reset: resetMutation } = mutation;

  const { awaitWorkflow } = useWorkflowAwaiter({
    workflowName: UPDATE_SELLABLE_PRODUCT_WORKFLOW,
  });

  const submit = useCallback(async () => {
    if (!productUpdateLink) {
      throw new Error("Missing update link");
    }

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

    const contributions = mergeContributions(results, PRODUCT_SLICES) as UpdateProductContributions;
    const payload = buildUpdateSellableProductRequest(productId, values, intent, contributions);

    try {
      await awaitWorkflow((idempotencyKey) =>
        mutateAsync({
          link: productUpdateLink,
          request: { ...payload, idempotencyKey },
        }),
      );

      void invalidateProductQueries(queryClient, productId);
      onLifecycleEvent?.({ type: "updated" });
      resetMutation();
      refetch?.();
    } catch (error) {
      resetMutation();
      if (error instanceof WorkflowTimeoutError) {
        onLifecycleEvent?.({ type: "updateTimedOut" });
      } else {
        onLifecycleEvent?.({ type: "updateFailed" });
      }
      throw error;
    }
  }, [
    awaitWorkflow,
    getValues,
    mutateAsync,
    onLifecycleEvent,
    productId,
    productUpdateLink,
    queryClient,
    refetch,
    resetMutation,
    validate,
  ]);

  return {
    submit,
  };
}
