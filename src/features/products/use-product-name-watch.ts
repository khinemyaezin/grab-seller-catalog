import { useFormContext, useWatch } from "react-hook-form";
import { ProductFormValue, ProductLifecycleEvent } from "@/features/products/types";
import { useEffect } from "react";

type UseProductNameWatchProps = {
    onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};
export default function useProductNameWatch({
    onLifecycleEvent,
}: UseProductNameWatchProps) {
    const { control } = useFormContext<ProductFormValue>();
    const name = useWatch({
        control,
        name: "product.name",
    });

    useEffect(() => {
        if (name !== undefined) {
            onLifecycleEvent?.({ type: "titleResolved", title: name });
        }
    }, [name, onLifecycleEvent]);
}