import { Controller, useFormContext, type FieldPath } from "react-hook-form";
import { Checkbox } from "@khinemyaezin/seller-ui/components/checkbox";
import { Field, FieldLabel } from "@khinemyaezin/seller-ui/components/field";
import type { ProductFormValue } from "../types";

type ManageInventoryFieldProps = {
  name: FieldPath<ProductFormValue> | `product.variants.${number}.manageInventory`;
  id?: string;
};

export function tracksInventory(value?: boolean | null): boolean {
  return value === true;
}

export function ManageInventoryField({ name, id }: ManageInventoryFieldProps) {
  const { control } = useFormContext<ProductFormValue>();
  const inputId = id ?? name.replaceAll(".", "-");

  return (
    <Field>
      <div className="flex items-center gap-2">
        <Controller
          name={name as FieldPath<ProductFormValue>}
          control={control}
          render={({ field }) => (
            <Checkbox
              id={inputId}
              checked={tracksInventory(field.value as boolean | undefined)}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          )}
        />
        <FieldLabel htmlFor={inputId}>Track inventory</FieldLabel>
      </div>
    </Field>
  );
}
