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
import type {
  ProductFormValue,
  ProductLifecycleEvent,
  UpdateProductContributions,
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
      const payload = buildUpdateSellableProductRequest(
        productId,
        values,
        intent,
        contributions,
      );

      try {
        await execute(payload);
      } catch (error) {
        resetCommand();
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
      resetCommand();
      return;
    }

    const media = await attach(productId);
    const descriptions = await attachDescriptions(productId);
    if (
      !catalogDirty
      && staged.status === "skipped"
      && media.status === "skipped"
      && descriptions.status === "skipped"
    ) {
      return;
    }

    if (media.status === "failed") {
      onLifecycleEvent?.({ type: "updateMediaFailed" });
      if (!catalogDirty) {
        throw media.error;
      }
      void invalidateProductQueries(queryClient, productId);
      resetCommand();
      return;
    }

    if (descriptions.status === "failed") {
      onLifecycleEvent?.({ type: "updateDescriptionFailed" });
      if (!catalogDirty) {
        throw descriptions.error;
      }
      void invalidateProductQueries(queryClient, productId);
      resetCommand();
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
