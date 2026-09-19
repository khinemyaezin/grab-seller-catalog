import { Input } from "@khinemyaezin/seller-ui/components/index";
import { useController, UseControllerProps } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@khinemyaezin/seller-ui/components/field";
import { useRewritePublicationSku } from "@/features/products/lib/use-rewrite-publication-sku";

export default function ProductStandaloneVariantField({ ...props }: UseControllerProps) {
    const { field, fieldState } = useController(props);
    const rewritePublicationSku = useRewritePublicationSku();
    return (
        <div className="grid gap-4">
            <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="input-standalone-sku">SKU (Stock Keeping Unit)</FieldLabel>
                <Input className="max-w-sm"
                    id="input-standalone-sku"
                    aria-invalid={fieldState.invalid}
                    {...field}
                    onChange={(event) => {
                        const previous = field.value;
                        field.onChange(event);
                        rewritePublicationSku(previous, event.target.value);
                    }}
                />
                {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                )}
            </Field>
        </div>
    );
}
