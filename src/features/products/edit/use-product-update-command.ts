import { useCallback } from "react";
import type { HateoasLink } from "@khinemyaezin/seller-api";
import { useUpdateSellableProductMutation } from "@/features/products/api/use-products";
import { useCatalogLink } from "@/features/products/api/use-root";
import { UPDATE_SELLABLE_PRODUCT_WORKFLOW } from "@/features/products/lib/create-sellable-product-workflow";
import type { UpdateSellableProductRequest } from "@/features/products/types";
import { useWorkflowAwaiter } from "@/features/products/use-workflow-awaiter";

export type UseUpdateSellableProductCommandProps = {
  link?: HateoasLink;
};

export type UseUpdateSellableProductCommandResult = {
  execute: (payload: UpdateSellableProductRequest) => Promise<{ productId: string }>;
  reset: () => void;
  isPending: boolean;
  link: HateoasLink | undefined;
};

export function useUpdateSellableProductCommand({
  link,
}: UseUpdateSellableProductCommandProps = {}): UseUpdateSellableProductCommandResult {
  const catalogLink = useCatalogLink("updateSellableProduct");
  const updateLink = link ?? catalogLink;
  const { mutateAsync, reset, isPending } = useUpdateSellableProductMutation();
  const { awaitWorkflow } = useWorkflowAwaiter({
    workflowName: UPDATE_SELLABLE_PRODUCT_WORKFLOW,
  });

  const execute = useCallback(
    async (payload: UpdateSellableProductRequest) => {
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
      return { productId: payload.productId };
    },
    [awaitWorkflow, mutateAsync, reset, updateLink],
  );

  return { execute, reset, isPending, link: updateLink };
}
