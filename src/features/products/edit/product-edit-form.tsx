import { useEffect } from "react";
import { Card, CardContent } from "@khinemyaezin/seller-ui/components/card";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import ProductBasicFieldSet from "@/features/products/ui/product-basic-fieldset";
import ProductMediaFieldSet from "@/features/products/ui/product-media-fieldset";
import { useProductUpdateSubmit } from "./use-product-update-submit";
import { ProductFormValue, ProductLifecycleEvent } from "@/features/products/types";
import ProductEditVariation from "./product-edit-variation";
import { PricingEditStandalone } from "@/features/products/ui/slots/pricing/pricing-edit-standalone";
import { HateoasLink } from "@khinemyaezin/seller-api";
import { useContextBar, useResetAllSlots, useIsExtensionDirty } from "@khinemyaezin/seller-ui";
import useProductNameWatch from "@/features/products/use-product-name-watch";
import { InventoryEditStandalone } from "@/features/products/ui/slots/inventory/inventory-edit-standalone";
import { SalesChannel } from "@/features/products/ui/sales-channel";
import { useMatrixSync } from "@/features/products/use-matrix-sync";

export type ProductEditFormProps = {
    productId: string;
    seed: ProductFormValue;
    actions?: Record<string, HateoasLink>;
    onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export default function ProductEditForm({
    productId,
    seed,
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
                actions={actions}
                onLifecycleEvent={onLifecycleEvent}
            />
        </FormProvider>
    );
}

function ProductEditFormFields({
    productId,
    seed,
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
            if (event.type === "updated" || event.type === "updateMediaFailed" || event.type === "updateDescriptionFailed") {
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

    useMatrixSync();

    return (
        <form onSubmit={handleSubmit(submit)} className="w-full flex flex-wrap gap-6 items-start justify-center">
            <div className="w-full max-w-2xl grid gap-6">
                <Card>
                    <CardContent className="flex flex-col gap-6">
                        <ProductBasicFieldSet />
                        <ProductMediaFieldSet />
                    </CardContent>
                </Card>
                <PricingEditStandalone />
                <InventoryEditStandalone />
                <ProductEditVariation />
            </div>
            <aside className="flex-1 min-w-70 max-w-2xl grid gap-6">
                <SalesChannel />
            </aside>
        </form>
    );
}
