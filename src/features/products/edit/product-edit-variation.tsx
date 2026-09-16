import { VariantTable } from "@/features/products/ui/variant-table";
import ProductVariationFieldSet from "@/features/products/ui/product-variation-fieldset";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, FieldGroup } from "@khinemyaezin/seller-ui/components/index";
import ProductStandaloneVariantField from "@/features/products/ui/product-standalone-field";
import { isStandaloneProductForm } from "@/features/products/lib/is-standalone-product-form";
import { useFormContext, useWatch } from "react-hook-form";
import { ProductFormValue } from "@/features/products/types";
import { pricingEditGroupId } from "@/features/products/lib/pricing-instance-id";
import { PricingEditInlineSlot } from "@/features/products/ui/slots/pricing/pricing-edit-inline-slot";

export default function ProductEditVariation() {
    const { control } = useFormContext<ProductFormValue>();
    const isStandalone = useWatch({
        control,
        name: "variationTypes",
        compute: (value) => isStandaloneProductForm(value),
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
                            <PricingEditInlineSlot
                                groupId={pricingEditGroupId(variant.matrixKey)}
                                context={{
                                    sku: variant.sku ?? "",
                                    variantId: variant.id ?? "",
                                }}
                            />
                        ),
                    }
                ]} />
        </Card>
    )
}