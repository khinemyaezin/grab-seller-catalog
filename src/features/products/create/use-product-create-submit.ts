import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { type HateoasLink } from "@khinemyaezin/seller-api";
import { PRODUCT_CONTRIBUTION_SLICES } from "@khinemyaezin/seller-contracts";
import { collectSlotFieldErrors, mergeContributions, useValidateAllSlots } from "@khinemyaezin/seller-ui";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateProductQueries } from "@/features/products/api/use-products";
import { useCreateSellableProductCommand } from "./use-product-create-command";
import { buildCreateSellableProductRequest } from "@/features/products/lib/create-sellable-product-request";
import type {
  ProductContributions,
  ProductFormValue,
  ProductLifecycleEvent,
} from "@/features/products/types";
import { useProductDescriptionSync } from "@/features/products/use-product-description-sync";
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

export function useProductCreateSubmit({
  link,
  onLifecycleEvent,
}: UseProductCreateSubmitOptions): UseProductCreateSubmitResult {
  const queryClient = useQueryClient();
  const { getValues } = useFormContext<ProductFormValue>();
  const { validate } = useValidateAllSlots();
  const { execute, reset: resetCommand } = useCreateSellableProductCommand(link);
  const { stage, attach } = useProductMediaSync();
  const { attach: attachDescriptions } = useProductDescriptionSync();

  const submit = useCallback(async () => {
    const results = await validate();
    const errors = collectSlotFieldErrors(results);
    if (results.some((result) => !result.valid)) {
      onLifecycleEvent?.({ type: "validationFailed", errors });
      throw new Error("Validation failed");
    }

    const staged = await stage();
    if (staged.status === "failed") {
      throw staged.error;
    }

    const contributions = mergeContributions(results, PRODUCT_SLICES) as ProductContributions;
    const payload = buildCreateSellableProductRequest(getValues(), contributions);

    let productId: string;
    try {
      const commandResult = await execute(payload);
      productId = commandResult.productId;
    } catch (error) {
      resetCommand();
      if (error instanceof WorkflowTimeoutError) {
        onLifecycleEvent?.({ type: "createTimedOut" });
      } else {
        onLifecycleEvent?.({ type: "createFailed" });
      }
      throw error;
    }

    const media = await attach(productId);
    const descriptions = await attachDescriptions(productId);

    if (media.status === "failed") {
      onLifecycleEvent?.({ type: "createMediaFailed", productId });
    } else if (descriptions.status === "failed") {
      onLifecycleEvent?.({ type: "createDescriptionFailed", productId });
    } else {
      onLifecycleEvent?.({ type: "created", productId });
    }
    void invalidateProductQueries(queryClient, productId);
  }, [
    attach,
    attachDescriptions,
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
