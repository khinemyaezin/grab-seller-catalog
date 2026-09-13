import { useEffect } from "react";
import { Skeleton } from "@khinemyaezin/seller-ui/components/index";
import { Card, CardContent } from "@khinemyaezin/seller-ui/components/card";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import ProductBasicFieldSet from "./product-basic-fieldset";
import { useProductUpdateSubmit } from "@/features/products/hooks/use-product-update-submit";
import { useProductEdit } from "@/features/products/hooks/use-product-edit";
import { ProductFormValue, ProductLifecycleEvent } from "../types";
import { ProductStatus } from "./product-status";
import ProductEditVariation from "./product-edit-variation";
import { PricingEditStandalone } from "./pricing-edit-standalone";
import { HateoasLink, resolveLink } from "@khinemyaezin/seller-api";
import ActionButtonGroup from "./product-edit-actions";
import { useContextBar, useResetAllSlots, useIsExtensionDirty } from "@khinemyaezin/seller-ui";
import useProductNameWatch from "../hooks/use-product-name-watch";
import { InventoryEditStandalone } from "./inventory-edit-standalone";
import { useMatrixSync } from "../hooks/use-matrix-sync";

export type ProductEditFormProps = {
    productId: string;
    onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export type ProductEditFormContentProps = {
    productId: string;
    seed: ProductFormValue;
    status?: string;
    actions?: Record<string, HateoasLink>;
    onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export default function ProductEditForm({
    productId,
    onLifecycleEvent,
}: ProductEditFormProps) {
    const { isLoading, isError, seed, status, actions } = useProductEdit({
        productId,
    });

    if (isError && !seed) {
        return (
            <Card>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Failed to load product.</p>
                </CardContent>
            </Card>
        );
    }

    if (isLoading || !seed) {
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
        <ProductEditFormContent
            productId={productId}
            seed={seed}
            status={status}
            actions={actions}
            onLifecycleEvent={onLifecycleEvent}
        />
    );
}

function ProductEditFormContent({
    productId,
    seed,
    status,
    actions,
    onLifecycleEvent,
}: ProductEditFormContentProps) {
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
}: ProductEditFormContentProps) {
    const { handleSubmit, reset, formState: { isDirty } } = useFormContext<ProductFormValue>();

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
                    status={status}
                    link={productPublishLink}
                    onLifecycleEvent={onLifecycleEvent}
                />
            </div>
        </div>
    );
}
