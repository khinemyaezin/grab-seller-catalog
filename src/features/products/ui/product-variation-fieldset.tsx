import { FieldGroup } from "@khinemyaezin/seller-ui/components/field";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus } from "lucide-react";
import { Item, ItemActions, ItemContent, ItemTitle } from "@khinemyaezin/seller-ui/components/item";
import type { ProductFormValue } from "@/features/products/types";
import { VariationTypeField } from "./product-variation-type-field";
import { ReactNode } from "react";

export type ProductVariationFieldSetProps = {
    standaloneVariantField?: ReactNode
}

export default function ProductVariationFieldSet({ standaloneVariantField }: ProductVariationFieldSetProps) {
    const { control, getValues } = useFormContext<ProductFormValue>();
    const { fields, remove, append } = useFieldArray({
        control,
        name: "variationTypes"
    });

    const handleAddType = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        append({ uuid: "", name: "", options: [] });
    }

    return (
        <div className="rounded-xl border overflow-hidden">
            {standaloneVariantField && (
                standaloneVariantField
            )}
            {fields.length !== 0 && (
                <FieldGroup className="gap-0">
                    {fields.map((_field, typeIndex) =>
                        <VariationTypeField
                            key={_field.id}
                            index={typeIndex}
                            onRemove={() => remove(typeIndex)}
                            control={control}
                            name={`variationTypes.${typeIndex}`}
                            getValues={getValues}
                        />)}
                </FieldGroup>
            )}
            <Item asChild size="sm" className="rounded-none cursor-pointer hover:bg-muted transition-colors">
                <button type="button" onClick={handleAddType}>
                    <ItemActions>
                        <Plus />
                    </ItemActions>
                    <ItemContent>
                        <ItemTitle>
                            {fields.length == 0 ? "Add variation" : "Add another option"}
                        </ItemTitle>
                    </ItemContent>
                </button>
            </Item>
        </div>
    );
}
