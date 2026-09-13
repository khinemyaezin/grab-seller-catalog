import { Controller, useFormContext, type FieldPath, type FieldValues } from "react-hook-form";
import { Checkbox } from "@khinemyaezin/seller-ui/components/checkbox";
import { Field, FieldLabel } from "@khinemyaezin/seller-ui/components/field";

type ManageInventoryFieldProps<TFieldValues extends FieldValues> = {
  name: FieldPath<TFieldValues>;
  id?: string;
};

export function tracksInventory(value?: boolean | null): boolean {
  return value === true;
}

export function ManageInventoryField<TFieldValues extends FieldValues>({
  name,
  id,
}: ManageInventoryFieldProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>();
  const inputId = id ?? String(name).replaceAll(".", "-");

  return (
    <Field>
      <div className="flex items-center gap-2">
        <Controller
          name={name}
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
