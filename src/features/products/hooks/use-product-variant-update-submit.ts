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
  useUpdateProductVariantMutation,
  invalidateProductQueries,
} from "@/features/products/hooks/use-products";
import { buildUpdateProductVariantRequest } from "@/features/products/adapters/update-product-variant-request";
import type {
  ProductLifecycleEvent,
  ProductVariantForm,
  UpdateProductContributions,
} from "@/features/products/types";
import { UPDATE_PRODUCT_VARIANT_WORKFLOW } from "@/features/products/constants/create-sellable-product-workflow";
import {
  useWorkflowAwaiter,
  WorkflowTimeoutError,
} from "@/features/products/hooks/use-workflow-awaiter";
import { useCatalogLink } from "./use-root";

const PRODUCT_SLICES = [
  PRODUCT_CONTRIBUTION_SLICES.PRICING_LINES,
  PRODUCT_CONTRIBUTION_SLICES.INVENTORY_LINES,
] as const;

export type UseProductVariantUpdateSubmitOptions = {
  productId: string;
  variantId: string;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export type UseProductVariantUpdateSubmitResult = {
  submit: () => Promise<void>;
};

export function useProductVariantUpdateSubmit({
  productId,
  variantId,
  onLifecycleEvent,
}: UseProductVariantUpdateSubmitOptions): UseProductVariantUpdateSubmitResult {
  const queryClient = useQueryClient();
  const { getValues } = useFormContext<ProductVariantForm>();
  const variantUpdateLink = useCatalogLink("updateProductVariant");

  const { validate } = useValidateAllSlots();
  const mutation = useUpdateProductVariantMutation();
  const { mutateAsync, reset: resetMutation } = mutation;

  const { awaitWorkflow } = useWorkflowAwaiter({
    workflowName: UPDATE_PRODUCT_VARIANT_WORKFLOW,
  });

  const submit = useCallback(async () => {
    if (!variantUpdateLink) {
      throw new Error("Missing update link");
    }

    const results = await validate();
    const errors = collectSlotFieldErrors(results);

    if (results.some((result) => !result.valid)) {
      onLifecycleEvent?.({ type: "validationFailed", errors });
      throw new Error("Validation failed");
    }

    const contributions = mergeContributions(results, PRODUCT_SLICES) as UpdateProductContributions;
    const payload = buildUpdateProductVariantRequest(
      productId,
      variantId,
      getValues(),
      contributions,
    );

    try {
      await awaitWorkflow((idempotencyKey) =>
        mutateAsync({
          link: variantUpdateLink,
          request: { ...payload, idempotencyKey },
        }),
      );

      void invalidateProductQueries(queryClient, productId);
      onLifecycleEvent?.({ type: "updated" });
      resetMutation();
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
    queryClient,
    resetMutation,
    validate,
    variantId,
    variantUpdateLink,
  ]);

  return {
    submit,
  };
}
