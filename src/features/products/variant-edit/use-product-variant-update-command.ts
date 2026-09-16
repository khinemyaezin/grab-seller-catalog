import { useCallback } from "react";
import type { HateoasLink } from "@khinemyaezin/seller-api";
import { useUpdateProductVariantMutation } from "@/features/products/api/use-products";
import { useCatalogLink } from "@/features/products/api/use-root";
import { UPDATE_PRODUCT_VARIANT_WORKFLOW } from "@/features/products/lib/create-sellable-product-workflow";
import type { UpdateProductVariantRequest } from "@/features/products/types";
import { useWorkflowAwaiter } from "@/features/products/use-workflow-awaiter";

export type UseUpdateProductVariantCommandResult = {
  execute: (payload: UpdateProductVariantRequest) => Promise<void>;
  reset: () => void;
  isPending: boolean;
  link: HateoasLink | undefined;
};

export function useUpdateProductVariantCommand(): UseUpdateProductVariantCommandResult {
  const updateLink = useCatalogLink("updateProductVariant");
  const { mutateAsync, reset, isPending } = useUpdateProductVariantMutation();
  const { awaitWorkflow } = useWorkflowAwaiter({
    workflowName: UPDATE_PRODUCT_VARIANT_WORKFLOW,
  });

  const execute = useCallback(
    async (payload: UpdateProductVariantRequest) => {
      if (!updateLink) {
        throw new Error("Missing update link");
      }

      await awaitWorkflow((idempotencyKey) =>
        mutateAsync({
          link: updateLink,
          request: { ...payload, idempotencyKey },
        }),
      );
      reset();
    },
    [awaitWorkflow, mutateAsync, reset, updateLink],
  );

  return { execute, reset, isPending, link: updateLink };
}
