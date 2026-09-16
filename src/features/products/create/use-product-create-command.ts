import { useCallback } from "react";
import type { HateoasLink } from "@khinemyaezin/seller-api";
import { useCreateSellableProductMutation } from "@/features/products/api/use-products";
import { resolveWorkflowProductId } from "@/features/products/api/workflow-product-id";
import { CREATE_SELLABLE_PRODUCT_WORKFLOW } from "@/features/products/lib/create-sellable-product-workflow";
import type { CreateSellableProductRequest } from "@/features/products/types";
import { useWorkflowAwaiter } from "@/features/products/use-workflow-awaiter";

export type UseCreateSellableProductCommandResult = {
  execute: (payload: CreateSellableProductRequest) => Promise<{ productId: string }>;
  reset: () => void;
  isPending: boolean;
};

export function useCreateSellableProductCommand(
  link: HateoasLink,
): UseCreateSellableProductCommandResult {
  const { mutateAsync, reset, isPending } = useCreateSellableProductMutation();
  const { awaitWorkflow } = useWorkflowAwaiter({
    workflowName: CREATE_SELLABLE_PRODUCT_WORKFLOW,
  });

  const execute = useCallback(
    async (payload: CreateSellableProductRequest) => {
      const result = await awaitWorkflow((idempotencyKey) =>
        mutateAsync({
          link,
          request: { ...payload, idempotencyKey },
        }),
      );
      const productId = await resolveWorkflowProductId(result);
      reset();
      return { productId };
    },
    [awaitWorkflow, link, mutateAsync, reset],
  );

  return { execute, reset, isPending };
}
