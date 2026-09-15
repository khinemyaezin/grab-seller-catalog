import { useEffect } from "react";
import { Card, CardContent } from "@khinemyaezin/seller-ui/components/card";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import ProductBasicFieldSet from "./product-basic-fieldset";
import ProductMediaFieldSet from "./product-media-fieldset";
import { useProductUpdateSubmit } from "@/features/products/hooks/use-product-update-submit";
import { ProductFormValue, ProductLifecycleEvent } from "../types";
import { ProductStatus } from "./product-status";
import ProductEditVariation from "./product-edit-variation";
import { PricingEditStandalone } from "./pricing-edit-standalone";
import { HateoasLink, resolveLink } from "@khinemyaezin/seller-api";
import { useContextBar, useResetAllSlots, useIsExtensionDirty } from "@khinemyaezin/seller-ui";
import useProductNameWatch from "../hooks/use-product-name-watch";
import { InventoryEditStandalone } from "./inventory-edit-standalone";
import { useMatrixSync } from "../hooks/use-matrix-sync";

export type ProductEditFormProps = {
    productId: string;
    seed: ProductFormValue;
    status?: string;
    actions?: Record<string, HateoasLink>;
    onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export default function ProductEditForm({
    productId,
    seed,
    status,
    actions,
    onLifecycleEvent,
}: ProductEditFormProps) {
    const form = useForm<ProductFormValue>({
        defaultValues: seed,
        mode: "onSubmit",
    });
    const { reset } = form;

    useEffect(() => {
        reset(seed);
    }, [reset, seed]);

    return (
        <FormProvider {...form}>
            <ProductEditFormFields
                productId={productId}
                seed={seed}
                status={status}
                actions={actions}
                onLifecycleEvent={onLifecycleEvent}
            />
        </FormProvider>
    );
}

function ProductEditFormFields({
    productId,
    seed,
    status,
    actions,
    onLifecycleEvent,
}: ProductEditFormProps) {
    const { handleSubmit, reset, formState: { isDirty } } = useFormContext<ProductFormValue>();

    const [isExtensionDirty, resetExtensionDirty] = useIsExtensionDirty();
    const resetAllSlots = useResetAllSlots();

    const { submit } = useProductUpdateSubmit({
        productId,
        seed,
        actions,
        onLifecycleEvent: (event) => {
            if (event.type === "updated" || event.type === "updateMediaFailed") {
                resetExtensionDirty();
            }
            onLifecycleEvent?.(event);
        },
    });

    useProductNameWatch({ onLifecycleEvent });

    useContextBar({
        dirty: isDirty || isExtensionDirty,
        onSave: async () => {
            let valid = false;
            await handleSubmit(
                async () => {
                    valid = true;
                    await submit();
                },
                () => {
                    valid = false;
                },
            )();
            if (!valid) {
                throw new Error("Form validation failed");
            }
        },
        onDiscard: () => {
            resetAllSlots();
            reset(seed);
            resetExtensionDirty();
        },
        groupId: "product-edit",
        label: "Edit Product",
    });

    const productPublishLink = resolveLink(actions, "publish-product");
    useMatrixSync();

    return (
        <div className="flex flex-col md:flex-row gap-6 items-start">
            <form onSubmit={handleSubmit(submit)} className="w-full grid gap-6">
                <Card>
                    <CardContent className="flex flex-col gap-6">
                        <ProductBasicFieldSet />
                        <ProductMediaFieldSet />
                    </CardContent>
                </Card>
                <PricingEditStandalone />
                <InventoryEditStandalone />
                <ProductEditVariation />
            </form>
            {/* <div className="flex w-full md:flex-1 flex-col gap-6">
                <ProductStatus
                    status={status}
                    link={productPublishLink}
                    onLifecycleEvent={onLifecycleEvent}
                />
            </div> */}
        </div>
    );
}
