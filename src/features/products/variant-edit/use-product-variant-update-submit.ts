import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  collectSlotFieldErrors,
  mergeContributions,
  useValidateAllSlots,
} from "@khinemyaezin/seller-ui";
import { PRODUCT_CONTRIBUTION_SLICES } from "@khinemyaezin/seller-contracts";
import { invalidateProductQueries } from "@/features/products/api/use-products";
import { buildUpdateProductVariantRequest } from "@/features/products/lib/update-product-variant-request";
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

    const contributions = mergeContributions(results, PRODUCT_SLICES) as UpdateProductContributions;
    const payload = buildUpdateProductVariantRequest(
      productId,
      variantId,
      getValues(),
      contributions,
    );

    try {
      await execute(payload);
      void invalidateProductQueries(queryClient, productId);
      onLifecycleEvent?.({ type: "updated" });
      resetCommand();
    } catch (error) {
      resetCommand();
      if (error instanceof WorkflowTimeoutError) {
        onLifecycleEvent?.({ type: "updateTimedOut" });
      } else {
        onLifecycleEvent?.({ type: "updateFailed" });
      }
      throw error;
    }
  }, [
    execute,
    getValues,
    link,
    onLifecycleEvent,
    productId,
    queryClient,
    resetCommand,
    validate,
    variantId,
  ]);

  return {
    submit,
  };
}
