import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  collectSlotFieldErrors,
  mergeContributions,
  useIsExtensionDirty,
  useValidateAllSlots,
} from "@khinemyaezin/seller-ui";
import { PRODUCT_CONTRIBUTION_SLICES } from "@khinemyaezin/seller-contracts";
import type { HateoasLink } from "@khinemyaezin/seller-api";
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
import { isCatalogFormDirty } from "@/features/products/lib/product-form-dirty";
import { useCatalogLink } from "./use-root";
import { useProductMediaSync } from "./use-product-media-sync";

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

export function useProductUpdateSubmit({
  productId,
  seed,
  actions,
  onLifecycleEvent,
}: UseProductUpdateSubmitOptions): UseProductUpdateSubmitResult {
  const queryClient = useQueryClient();
  const { getValues, formState: { dirtyFields } } = useFormContext<ProductFormValue>();
  const [extensionDirty] = useIsExtensionDirty();
  const productUpdateLink = useCatalogLink("updateSellableProduct");
  const { stage, attach } = useProductMediaSync({ seed: seed.medias, actions });

  const { validate } = useValidateAllSlots();
  const mutation = useUpdateSellableProductMutation();
  const { mutateAsync, reset: resetMutation } = mutation;

  const { awaitWorkflow } = useWorkflowAwaiter({
    workflowName: UPDATE_SELLABLE_PRODUCT_WORKFLOW,
  });

  const submit = useCallback(async () => {
    const values = getValues();
    const catalogDirty = isCatalogFormDirty(dirtyFields, extensionDirty);

    if (catalogDirty) {
      if (!productUpdateLink) {
        throw new Error("Missing update link");
      }

      const results = await validate();
      const errors = collectSlotFieldErrors(results);

      if (results.some((result) => !result.valid)) {
        onLifecycleEvent?.({ type: "validationFailed", errors });
        throw new Error("Validation failed");
      }

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
      } catch (error) {
        resetMutation();
        if (error instanceof WorkflowTimeoutError) {
          onLifecycleEvent?.({ type: "updateTimedOut" });
        } else {
          onLifecycleEvent?.({ type: "updateFailed" });
        }
        throw error;
      }
    }

    const staged = await stage();
    if (staged.status === "failed") {
      onLifecycleEvent?.({ type: "updateMediaFailed" });
      if (!catalogDirty) {
        throw staged.error;
      }
      void invalidateProductQueries(queryClient, productId);
      resetMutation();
      return;
    }

    const media = await attach(productId);
    if (!catalogDirty && staged.status === "skipped" && media.status === "skipped") {
      return;
    }

    if (media.status === "failed") {
      onLifecycleEvent?.({ type: "updateMediaFailed" });
      if (!catalogDirty) {
        throw media.error;
      }
      void invalidateProductQueries(queryClient, productId);
      resetMutation();
      return;
    }

    void invalidateProductQueries(queryClient, productId);
    onLifecycleEvent?.({ type: "updated" });
    resetMutation();
  }, [
    attach,
    awaitWorkflow,
    dirtyFields,
    extensionDirty,
    getValues,
    mutateAsync,
    onLifecycleEvent,
    productId,
    productUpdateLink,
    queryClient,
    resetMutation,
    stage,
    validate,
  ]);

  return {
    submit,
  };
}
