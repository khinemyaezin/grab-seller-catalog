import { Input } from "@khinemyaezin/seller-ui/components/index";
import { useController, UseControllerProps } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@khinemyaezin/seller-ui/components/field";

export default function ProductStandaloneVariantField({ ...props }: UseControllerProps) {
    const { field, fieldState } = useController(props);
    return (
        <div className="grid gap-4">
            <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="input-standalone-sku">SKU (Stock Keeping Unit)</FieldLabel>
                <Input className="max-w-sm"
                    id="input-standalone-sku"
                    aria-invalid={fieldState.invalid}
                    {...field}
                />
                {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                )}
            </Field>
        </div>
    );
}
