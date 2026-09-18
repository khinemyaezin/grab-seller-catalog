import { VariantTable } from "@/features/products/ui/variant-table";
import ProductVariationFieldSet from "@/features/products/ui/product-variation-fieldset";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FieldGroup } from "@khinemyaezin/seller-ui/components/index";
import ProductStandaloneVariantField from "@/features/products/ui/product-standalone-field";
import { isStandaloneProductForm } from "@/features/products/lib/is-standalone-product-form";
import { useFormContext, useWatch } from "react-hook-form";
import { ProductFormValue } from "@/features/products/types";
import { pricingEditGroupId } from "@/features/products/lib/pricing-instance-id";
import { PricingEditInlineSlot } from "@/features/products/ui/slots/pricing/pricing-edit-inline-slot";
import { VariantSalesChannelControl } from "@/features/products/ui/variant-sales-channel-control";
import { Store } from "lucide-react";

export type ProductEditVariationProps = {
};

export default function ProductEditVariation({ }: ProductEditVariationProps) {
    const { control } = useFormContext<ProductFormValue>();
    const isStandalone = useWatch({
        control,
        name: "variationTypes",
        compute: (value) => isStandaloneProductForm(value),
    })

    const productStatus = useWatch({
        control,
        name: "product.status"
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

    const saleChannels = productStatus == "ACTIVE" ? [
        {
            id: "publishing",
            header: "Publishing",
            cell: (variant: { sku: string }) => (
                <VariantSalesChannelControl
                    sku={variant.sku ?? ""}
                    trigger={(count) => {
                        return (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                aria-label={`${count} ${count === 1 ? "channel" : "channels"}`}
                            >
                                <Store /> {count}
                            </Button>
                        )
                    }}
                />
            ),
        }
    ]:[];

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
                    },
                    ...saleChannels
                ]} />
        </Card>
    )
}