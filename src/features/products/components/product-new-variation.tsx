import { VariantTable } from "./variant-table";
import ProductVariationFieldSet from "./product-variation-fieldset";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, FieldGroup } from "@khinemyaezin/seller-ui/components/index";
import ProductStandaloneVariantField from "./product-standalone-field";
import { useFormContext, useWatch } from "react-hook-form";
import { ProductFormValue } from "../types";
import { PricingInlineSlot } from "./pricing-inline-slot";
import { pricingInstanceId } from "../constants/pricing-instance-id";

export default function ProductNewVariation() {
    const { control } = useFormContext<ProductFormValue>();
    const isStandalone = useWatch({
        control,
        name: "variationTypes",
        compute: (value) => value.length == 0
    })

    const StandaloneVariantFieldGroup = (
        <FieldGroup className="p-6 border-b">
            <ProductStandaloneVariantField
                name="product.standaloneVariant.sku"
                rules={{
                    required: "SKU is required"
                }} />
        </FieldGroup>
    )

    return (
        <Card>
            <CardHeader>
                <CardTitle>Variations</CardTitle>
                <CardDescription>Define variant types and their options, then generate all combinations.</CardDescription>
            </CardHeader>
            <CardContent>
                <ProductVariationFieldSet
                    standaloneVariantField={isStandalone ? StandaloneVariantFieldGroup : undefined}
                />
            </CardContent>
            <VariantTable
                onAllVariantsDeleted={() => { }}
                columns={[
                    {
                        id: "price",
                        header: "Price",
                        cell: (variant) => (
                            <PricingInlineSlot
                                groupId={pricingInstanceId(variant.matrixKey)}
                                context={{ sku: variant.sku ?? "" }}
                            />
                        ),
                    }
                ]} />
        </Card>
    )
}