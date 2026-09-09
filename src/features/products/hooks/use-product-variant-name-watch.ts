import { useFormContext, useWatch } from "react-hook-form";
import { ProductFormValue, ProductLifecycleEvent } from "../types";
import { useEffect } from "react";

type UseProductVariantNameWatchProps = {
    variantId?: string;
    matrixKey?: string;
    onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export default function useProductVariantNameWatch({
    variantId,
    matrixKey,
    onLifecycleEvent,
}: UseProductVariantNameWatchProps) {
    const { control } = useFormContext<ProductFormValue>();
    const variants = useWatch({
        control,
        name: "product.variants",
    });

    const variant = variants?.find(
        (v) => (variantId && v.id === variantId) || (matrixKey && v.matrixKey === matrixKey)
    );
    const name = variant?.name;

    useEffect(() => {
        if (name !== undefined && name !== "") {
            onLifecycleEvent?.({ type: "titleResolved", title: name });
        }
    }, [name, onLifecycleEvent]);
}