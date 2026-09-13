
import { Skeleton } from "@khinemyaezin/seller-ui/components/index";
import { Card, CardContent } from "@khinemyaezin/seller-ui/components/card";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import ProductBasicFieldSet from "./product-basic-fieldset";
import { useProductUpdateSubmit } from "@/features/products/hooks/use-product-update-submit";
import { useProductEdit, DEFAULT_PRODUCT_FORM_VALUE } from "@/features/products/hooks/use-product-edit";
import { ProductFormValue, ProductLifecycleEvent } from "../types";
import { ProductStatus } from "./product-status";
import ProductEditVariation from "./product-edit-variation";
import { PricingEditStandalone } from "./pricing-edit-standalone";
import { resolveLink } from "@khinemyaezin/seller-api";
import ActionButtonGroup from "./product-edit-actions";
import { useContextBar, useResetAllSlots, useIsExtensionDirty } from "@khinemyaezin/seller-ui";
import useProductNameWatch from "../hooks/use-product-name-watch";
import { InventoryEditStandalone } from "./inventory-edit-standalone";
import { useMatrixSync } from "../hooks/use-matrix-sync";

export type ProductEditFormProps = {
    productId: string;
    onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export default function ProductEditForm(props: ProductEditFormProps) {
    const form = useForm<ProductFormValue>({
        defaultValues: DEFAULT_PRODUCT_FORM_VALUE,
        mode: "onSubmit",
    });

    return (
        <FormProvider {...form}>
            <ProductEditFormContent {...props} />
        </FormProvider>
    );
}

function ProductEditFormContent({
    productId,
    onLifecycleEvent,
}: ProductEditFormProps) {
    const { handleSubmit, reset, formState: { isDirty } } = useFormContext<ProductFormValue>();

    const { isLoading: isFetchingProductById, refetch, status: productStatus, actions } = useProductEdit({
        productId,
        onLifecycleEvent,
    });

    const [isExtensionDirty, resetExtensionDirty] = useIsExtensionDirty();
    const resetAllSlots = useResetAllSlots();

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
            reset();
            refetch();
            resetExtensionDirty();
        },
        groupId: "product-edit",
        label: "Edit Product",
    });

    const productPublishLink = resolveLink(actions, "publish-product");
    useMatrixSync();

    if (isFetchingProductById) {
        return (
            <div className="flex w-full flex-col gap-7">
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-full" />
                </div>
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-full" />
                </div>
                <Skeleton className="h-8 w-24" />
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row gap-6 items-start">
            <form onSubmit={handleSubmit(submit)} className="w-full md:w-[60%] grid gap-6">
                <Card>
                    <CardContent>
                        <ProductBasicFieldSet />
                    </CardContent>
                </Card>
                <PricingEditStandalone />
                <InventoryEditStandalone />
                <ProductEditVariation />
                <ActionButtonGroup links={actions} onLifecycleEvent={onLifecycleEvent} />
            </form>
            <div className="flex w-full md:flex-1 flex-col gap-6">
                <ProductStatus
                    status={productStatus}
                    link={productPublishLink}
                    onLifecycleEvent={onLifecycleEvent}
                />
            </div>
        </div>
    );
}

