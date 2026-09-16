import { STANDALONE_PRICING_EDIT_GROUP_ID } from "@/features/products/lib/pricing-instance-id";
import { Card, CardContent } from "@khinemyaezin/seller-ui/components/card";
import { PricingLineEditFullSlot } from "./pricing-edit-full-slot";
import { isStandaloneProductForm } from "@/features/products/lib/is-standalone-product-form";
import { useFormContext, useWatch } from "react-hook-form";
import { ProductFormValue } from "@/features/products/types";

export function PricingEditStandalone() {
    const { control } = useFormContext<ProductFormValue>();
    const isStandalone = useWatch({
        control,
        name: "variationTypes",
        compute: (value) => isStandaloneProductForm(value),
    })
    const sku = useWatch({
        control,
        name: "product.standaloneVariant.sku",
        defaultValue: "",
    });
    const variantId = useWatch({
        control,
        name: "product.standaloneVariant.id",
        defaultValue: "",
    });

    if(!isStandalone) return;

    return (
        <Card>
            <CardContent>
                <PricingLineEditFullSlot
                    groupId={STANDALONE_PRICING_EDIT_GROUP_ID}
                    context={{
                        sku: sku ?? "",
                        variantId: variantId ?? "",
                    }}
                />
            </CardContent>
        </Card>
    )
}
