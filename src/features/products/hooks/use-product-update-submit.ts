import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useIsExtensionDirty } from "@khinemyaezin/seller-ui";
import type { HateoasLink } from "@khinemyaezin/seller-api";
import { invalidateProductQueries } from "@/features/products/hooks/use-products";
import type {
  ProductFormValue,
  ProductLifecycleEvent,
} from "@/features/products/types";
import { isCatalogFormDirty } from "@/features/products/lib/product-form-dirty";
import { useProductMediaSync } from "./use-product-media-sync";
import { useProductDescriptionSync } from "./use-product-description-sync";
import { useProductUpdateWorkflow } from "./use-product-update-workflow";

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
  const { formState: { dirtyFields } } = useFormContext<ProductFormValue>();
  const [extensionDirty] = useIsExtensionDirty();
  const { stage, attach } = useProductMediaSync({ seed: seed.medias, actions });
  const { attach: attachDescriptions } = useProductDescriptionSync({
    seed: seed.descriptions,
    actions,
  });
  const { submitWorkflow, reset: resetWorkflow } = useProductUpdateWorkflow({
    productId,
    onLifecycleEvent,
  });

  const submit = useCallback(async () => {
    const catalogDirty = isCatalogFormDirty(dirtyFields, extensionDirty);

    if (catalogDirty) {
      await submitWorkflow();
    }

    const staged = await stage();
    if (staged.status === "failed") {
      onLifecycleEvent?.({ type: "updateMediaFailed" });
      if (!catalogDirty) {
        throw staged.error;
      }
      void invalidateProductQueries(queryClient, productId);
      resetWorkflow();
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
      resetWorkflow();
      return;
    }

    if (descriptions.status === "failed") {
      onLifecycleEvent?.({ type: "updateDescriptionFailed" });
      if (!catalogDirty) {
        throw descriptions.error;
      }
      void invalidateProductQueries(queryClient, productId);
      resetWorkflow();
      return;
    }

    void invalidateProductQueries(queryClient, productId);
    onLifecycleEvent?.({ type: "updated" });
    resetWorkflow();
  }, [
    attach,
    attachDescriptions,
    dirtyFields,
    extensionDirty,
    onLifecycleEvent,
    productId,
    queryClient,
    resetWorkflow,
    stage,
    submitWorkflow,
  ]);

  return {
    submit,
  };
}
