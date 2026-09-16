import { useCallback } from "react";
import { type HateoasLink } from "@khinemyaezin/seller-api";
import { collectSlotFieldErrors, useValidateAllSlots } from "@khinemyaezin/seller-ui";
import { useQueryClient } from "@tanstack/react-query";
import {
  invalidateProductQueries,
} from "@/features/products/hooks/use-products";
import type {
  ProductLifecycleEvent,
} from "@/features/products/types";
import {
  WorkflowTimeoutError,
} from "@/features/products/hooks/use-workflow-awaiter";
import { useProductMediaSync } from "@/features/products/hooks/use-product-media-sync";
import { useProductDescriptionSync } from "@/features/products/hooks/use-product-description-sync";
import { useProductCreateWorkflow } from "./use-product-create-workflow";

export type UseProductCreateSubmitOptions = {
  link: HateoasLink;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
  onSuccess?: (productId: string) => void;
};

export type UseProductCreateSubmitResult = {
  submit: () => Promise<void>;
};

export function useProductCreateSubmit({
  link,
  onLifecycleEvent,
  onSuccess,
}: UseProductCreateSubmitOptions): UseProductCreateSubmitResult {
  const queryClient = useQueryClient();
  const { validate } = useValidateAllSlots();
  const { submitWorkflow, reset: resetWorkflow } = useProductCreateWorkflow({ link, onLifecycleEvent });
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

    let productId: string;
    try {
      const workflowResult = await submitWorkflow();
      productId = workflowResult.productId;
    } catch (error) {
      resetWorkflow();
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
      onLifecycleEvent?.({ type: "createMediaFailed" });
    } else if (descriptions.status === "failed") {
      onLifecycleEvent?.({ type: "createDescriptionFailed" });
    } else {
      onLifecycleEvent?.({ type: "created" });
    }
    void invalidateProductQueries(queryClient, productId);
    onSuccess?.(productId);
  }, [
    attach,
    attachDescriptions,
    onLifecycleEvent,
    onSuccess,
    queryClient,
    resetWorkflow,
    stage,
    submitWorkflow,
    validate,
  ]);
  return { submit };
}
