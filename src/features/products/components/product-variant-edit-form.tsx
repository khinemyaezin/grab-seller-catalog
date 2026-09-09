import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { useProductUpdateSubmit } from "@/features/products/hooks/use-product-update-submit";
import { useProductEdit, DEFAULT_PRODUCT_FORM_VALUE } from "@/features/products/hooks/use-product-edit";
import { ProductFormValue, ProductLifecycleEvent } from "../types";
import { useContextBar, useResetAllSlots } from "@khinemyaezin/seller-ui";
import { useIsExtensionDirty } from "../context/extension-sync-store";
import { PricingLineEditFullSlot } from "./pricing-edit-full-slot";
import { pricingEditGroupId } from "@/features/products/constants/pricing-instance-id";
import { Skeleton } from "@khinemyaezin/seller-ui/components/index";
import { Card, CardContent } from "@khinemyaezin/seller-ui/components/card";
import { usePricingEditSlotsSync } from "../hooks/use-pricing-edit-slots-sync";
import { useInventoryEditSlotsSync } from "../hooks/use-inventory-edit-slots-sync";
import { InventoryLineEditFullSlot } from "./inventory-edit-full-slot";
import useProductVariantNameWatch from "../hooks/use-product-variant-name-watch";

export type ProductVariantEditFormProps = {
    productId: string;
    variantId: string;
    onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export default function ProductVariantEditForm(props: ProductVariantEditFormProps) {
    const form = useForm<ProductFormValue>({
        defaultValues: DEFAULT_PRODUCT_FORM_VALUE,
        mode: "onSubmit",
    });

    return (
        <FormProvider {...form}>
            <ProductVariantEditFormContent {...props} />
        </FormProvider>
    );
}

function ProductVariantEditFormContent({
    productId,
    variantId,
    onLifecycleEvent,
}: ProductVariantEditFormProps) {
    const { handleSubmit, reset, formState: { isDirty }, control } = useFormContext<ProductFormValue>();

    const { isLoading: isFetchingProductById, refetch } = useProductEdit({
        productId,
        onLifecycleEvent,
    });

    const [isExtensionDirty, resetExtensionDirty] = useIsExtensionDirty();
    const resetAllSlots = useResetAllSlots();
    useProductVariantNameWatch({ variantId, onLifecycleEvent });
    
    const { submit } = useProductUpdateSubmit({
        productId,
        onLifecycleEvent: (event) => {
            if (event.type === "updated") {
                resetExtensionDirty();
            }
            onLifecycleEvent?.(event);
        },
        refetch,
    });

    const variant = useWatch({
        control,
        name: "product.variants",
        compute: (variants) =>
          (variants ?? []).find((v) => v.id === variantId),
    });

    const sku = variant?.sku ?? "";
    
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
            reset();
            refetch();
            resetExtensionDirty();
        },
        groupId: `variant-edit-${variantId}`,
        label: "Edit Variant",
    });

    usePricingEditSlotsSync();
    useInventoryEditSlotsSync();

    if (isFetchingProductById) {
        return (
            <div className="flex w-full flex-col gap-7">
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6 w-full">
            <Card>
                <CardContent>
                    <PricingLineEditFullSlot groupId={pricingEditGroupId(variantId)} context={{ sku, variantId }} />
                </CardContent>
            </Card>
            <Card>
                <CardContent>
                    <InventoryLineEditFullSlot groupId={variantId} context={{ sku, variantId }} />
                </CardContent>
            </Card>
        </form>
    );
}
