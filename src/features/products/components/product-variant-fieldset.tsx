import { Input } from "@khinemyaezin/seller-ui/components/index";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@khinemyaezin/seller-ui/components/field";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { ProductVariantForm } from "../types";

export default function ProductVariantFieldSet() {
  const { control } = useFormContext<ProductVariantForm>();
  const name = useWatch({ control, name: "name" });

  return (
    <FieldSet>
      <FieldLegend>Variant Information</FieldLegend>
      <FieldDescription>
        Update this variant's SKU. Name is derived from its options.
      </FieldDescription>
      <FieldGroup>
        <div className="grid grid-rows-1 lg:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="variant-info-name">Name</FieldLabel>
            <Input
              id="variant-info-name"
              value={name ?? ""}
              readOnly
              aria-readonly="true"
            />
          </Field>
          <Controller
            control={control}
            name="sku"
            rules={{
              required: "SKU is required.",
            }}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="variant-info-sku">SKU (Stock Keeping Unit)</FieldLabel>
                <Input
                  id="variant-info-sku"
                  placeholder="TSHIRT-RED-L"
                  aria-invalid={fieldState.invalid}
                  {...field}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </FieldGroup>
    </FieldSet>
  );
}
