import { HateoasLink } from "@khinemyaezin/seller-api";
import { useValidateAllSlots, collectSlotFieldErrors, mergeContributions } from "@khinemyaezin/seller-ui";
import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { buildCreateSellableProductRequest } from "../adapters/create-sellable-product-request";
import { CREATE_SELLABLE_PRODUCT_WORKFLOW } from "../constants/create-sellable-product-workflow";
import { ProductFormValue, ProductContributions, ProductLifecycleEvent } from "../types";
import { useCreateSellableProductMutation } from "./use-products";
import { useWorkflowAwaiter } from "./use-workflow-awaiter";
import { PRODUCT_CONTRIBUTION_SLICES } from "@khinemyaezin/seller-contracts";
import { resolveWorkflowProductId } from "../api/workflow-product-id";

const PRODUCT_SLICES = [
    PRODUCT_CONTRIBUTION_SLICES.PRICING_LINES,
    PRODUCT_CONTRIBUTION_SLICES.INVENTORY_LINES,
] as const;

export type UseProductCreateWorkflowProps = {
    link: HateoasLink;
    onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export type SubmitWorkflowReturn = {
    productId: string,
}

export function useProductCreateWorkflow({ link, onLifecycleEvent }: UseProductCreateWorkflowProps) {
    const { getValues } = useFormContext<ProductFormValue>();
    const { validate } = useValidateAllSlots();
    const mutation = useCreateSellableProductMutation();
    const { awaitWorkflow } = useWorkflowAwaiter({
        workflowName: CREATE_SELLABLE_PRODUCT_WORKFLOW,
    });

    const submitWorkflow = useCallback(
        async (): Promise<SubmitWorkflowReturn> => {
            const results = await validate();
            const errors = collectSlotFieldErrors(results);

            if (results.some((result) => !result.valid)) {
                onLifecycleEvent?.({ type: "validationFailed", errors });
                throw new Error("Validation failed");
            }

            const values = getValues();
            const contributions = mergeContributions(results, PRODUCT_SLICES) as ProductContributions;
            const payload = buildCreateSellableProductRequest(values, contributions);

            const result = await awaitWorkflow((idempotencyKey) =>
                mutation.mutateAsync({
                    link,
                    request: { ...payload, idempotencyKey },
                }),
            );

            const productId = await resolveWorkflowProductId(result);
            mutation.reset();

            return {
                productId
            };
        }, [awaitWorkflow, getValues, link, mutation, validate]
    );

    return { submitWorkflow, reset: mutation.reset };
}
