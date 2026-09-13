import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { ProductLifecycleEvent } from "../types";
import {
  collectSlotFieldErrors,
  useContextBar,
  useResetAllSlots,
  useIsExtensionDirty,
  useValidateAllSlots,
} from "@khinemyaezin/seller-ui";
import { Skeleton } from "@khinemyaezin/seller-ui/components/index";
import { Card, CardContent } from "@khinemyaezin/seller-ui/components/card";
import useProductVariantNameWatch from "../hooks/use-product-variant-name-watch";
import { ProductVariantForm } from "../types/catalog.form";
import { useProductVariantEdit } from "../hooks/use-product-variant-edit";
import { PricingLineEditFullSlot } from "./pricing-edit-full-slot";
import { InventoryLineEditFullSlot } from "./inventory-edit-full-slot";
import { pricingEditGroupId } from "../constants/pricing-instance-id";
import { inventoryEditGroupId } from "../constants/inventory-group-id";

export const DEFAULT_VARIANT_FORM: ProductVariantForm = {
    name: "",
    matrixKey: "",
    sku: "",
    variations: []
}

export type ProductVariantEditFormProps = {
    productId: string;
    variantId: string;
    onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export default function ProductVariantEditForm(props: ProductVariantEditFormProps) {
    const form = useForm<ProductVariantForm>({
        defaultValues: DEFAULT_VARIANT_FORM,
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
    const { handleSubmit, reset, formState: { isDirty }, control } = useFormContext<ProductVariantForm>();

    const { isLoading: isFetchingVariantById, refetch } = useProductVariantEdit({
        productId,
        variantId,
        onLifecycleEvent,
    });

    const [isExtensionDirty, resetExtensionDirty] = useIsExtensionDirty();
    const resetAllSlots = useResetAllSlots();
    const { validate } = useValidateAllSlots();
    useProductVariantNameWatch({ variantId, onLifecycleEvent });

    const sku = useWatch({ control, name: "sku" });
    const matrixKey = useWatch({ control, name: "matrixKey" });

    const submit = async () => {
        const results = await validate();
        const errors = collectSlotFieldErrors(results);
        if (results.some((result) => !result.valid)) {
            onLifecycleEvent?.({ type: "validationFailed", errors });
            throw new Error("Validation failed");
        }
    };

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

    if (isFetchingVariantById) {
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
                    <PricingLineEditFullSlot
                        groupId={pricingEditGroupId(matrixKey || variantId)}
                        context={{ sku: sku ?? "", variantId }}
                    />
                </CardContent>
            </Card>
            <InventoryLineEditFullSlot
                groupId={inventoryEditGroupId(matrixKey || variantId)}
                context={{ sku: sku ?? "", variantId }}
            />
        </form>
    );
}
