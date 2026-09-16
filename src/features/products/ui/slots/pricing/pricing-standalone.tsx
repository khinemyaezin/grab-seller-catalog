import { STANDALONE_PRICING_INSTANCE_ID } from "@/features/products/lib/pricing-instance-id";
import { Card, CardContent } from "@khinemyaezin/seller-ui/components/card";
import { PricingLineFullSlot } from "./pricing-full-slot";
import { isStandaloneProductForm } from "@/features/products/lib/is-standalone-product-form";
import { useFormContext, useWatch } from "react-hook-form";
import { ProductFormValue } from "@/features/products/types";

export function PricingStandalone() {
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

    if (!isStandalone) return;
    
    return (
        <Card>
            <CardContent>
                <PricingLineFullSlot
                    groupId={STANDALONE_PRICING_INSTANCE_ID}
                    context={{ sku: sku ?? "" }}
                />
            </CardContent>
        </Card>
    )
}
