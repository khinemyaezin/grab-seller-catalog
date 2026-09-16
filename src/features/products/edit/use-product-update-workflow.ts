import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import type { HateoasLink } from "@khinemyaezin/seller-api";
import {
  collectSlotFieldErrors,
  mergeContributions,
  useValidateAllSlots,
} from "@khinemyaezin/seller-ui";
import { PRODUCT_CONTRIBUTION_SLICES } from "@khinemyaezin/seller-contracts";
import { useUpdateSellableProductMutation } from "@/features/products/api/use-products";
import { buildUpdateSellableProductRequest } from "@/features/products/lib/update-sellable-product-request";
import { determineUpdateIntent } from "@/features/products/lib/update-product-request";
import type {
  ProductFormValue,
  ProductLifecycleEvent,
  UpdateProductContributions,
} from "@/features/products/types";
import { UPDATE_SELLABLE_PRODUCT_WORKFLOW } from "@/features/products/lib/create-sellable-product-workflow";
import {
  useWorkflowAwaiter,
  WorkflowTimeoutError,
} from "@/features/products/use-workflow-awaiter";
import { useCatalogLink } from "@/features/products/api/use-root";

const PRODUCT_SLICES = [
  PRODUCT_CONTRIBUTION_SLICES.PRICING_LINES,
  PRODUCT_CONTRIBUTION_SLICES.INVENTORY_LINES,
] as const;

export type UseProductUpdateWorkflowProps = {
  productId: string;
  link?: HateoasLink;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export type SubmitWorkflowReturn = {
  productId: string;
};

export function useProductUpdateWorkflow({
  productId,
  link,
  onLifecycleEvent,
}: UseProductUpdateWorkflowProps) {
  const { getValues } = useFormContext<ProductFormValue>();
  const catalogLink = useCatalogLink("updateSellableProduct");
  const updateLink = link ?? catalogLink;

  const { validate } = useValidateAllSlots();
  const mutation = useUpdateSellableProductMutation();
  const { mutateAsync, reset: resetMutation } = mutation;

  const { awaitWorkflow } = useWorkflowAwaiter({
    workflowName: UPDATE_SELLABLE_PRODUCT_WORKFLOW,
  });

  const submitWorkflow = useCallback(
    async (): Promise<SubmitWorkflowReturn> => {
      if (!updateLink) {
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

      const contributions = mergeContributions(
        results,
        PRODUCT_SLICES,
      ) as UpdateProductContributions;
      const payload = buildUpdateSellableProductRequest(
        productId,
        values,
        intent,
        contributions,
      );

      try {
        await awaitWorkflow((idempotencyKey) =>
          mutateAsync({
            link: updateLink,
            request: { ...payload, idempotencyKey },
          }),
        );
        resetMutation();
        return { productId };
      } catch (error) {
        resetMutation();
        if (error instanceof WorkflowTimeoutError) {
          onLifecycleEvent?.({ type: "updateTimedOut" });
        } else {
          onLifecycleEvent?.({ type: "updateFailed" });
        }
        throw error;
      }
    },
    [
      awaitWorkflow,
      getValues,
      mutateAsync,
      onLifecycleEvent,
      productId,
      resetMutation,
      updateLink,
      validate,
    ],
  );

  return { submitWorkflow, reset: resetMutation };
}
