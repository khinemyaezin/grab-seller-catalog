import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Input } from "@khinemyaezin/seller-ui/components/input";
import { Button } from "@khinemyaezin/seller-ui/components/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@khinemyaezin/seller-ui/components/table";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Checkbox } from "@khinemyaezin/seller-ui/components/checkbox";
import { Field, FieldError } from "@khinemyaezin/seller-ui/components/field";
import type { ProductFormValue, Variant } from "@/features/products/types";

type VariantTableProps = {
  onAllVariantsDeleted?: () => void;
  columns?: VariantColumnExtension[];

}

type VariantColumnExtension = {
  id: string;
  header: React.ReactNode;
  cell: (variant: Variant, index: number) => React.ReactNode;
};

export function VariantTable({ onAllVariantsDeleted, columns }: VariantTableProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const { control, setValue, getValues } = useFormContext<ProductFormValue>();
  const variants = useWatch({
    control,
    name: "product.variants",
    defaultValue: [],
  });

  const variantFields = useMemo(() =>
    variants
      .map((field, index) => ({ field, index }))
      .filter(({ field }) => field.variations.length > 0),
    [variants]
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIndices(variantFields.map(({ index }) => index));
    } else {
      setSelectedIndices([]);
    }
  };

  function toggleSelection(index: number) {
    setSelectedIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  function handleDelete() {
    const isDeletingAll = selectedIndices.length === variantFields.length;
    const currentVariants = getValues("product.variants") || [];
    const nextVariants = currentVariants.filter((_, idx) => !selectedIndices.includes(idx));
    setValue("product.variants", nextVariants, { shouldDirty: true });
    setSelectedIndices([]);
    if (isDeletingAll) {
      onAllVariantsDeleted?.();
    }
  }

  return variantFields.length !== 0 && (
    <div>
      <div className="p-(--card-spacing) flex items-center justify-end">
        {selectedIndices.length > 0 && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
          >
            Delete Selected ({selectedIndices.length})
          </Button>
        )}
      </div>
      <Table className="[&_tr>*:first-child]:pl-(--card-spacing) [&_tr>*:last-child]:pr-(--card-spacing) border-t">
        <TableCaption>List of generated product variants.</TableCaption>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selectedIndices.length === variantFields.length && variantFields.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            {columns?.map((col) => (
              <TableHead key={col.id}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {variantFields.map(({ field: variant, index }) => {
            return (
              <TableRow
                key={variant.matrixKey}
              >
                <TableCell className="px-4 py-2">
                  <Checkbox
                    checked={selectedIndices.includes(index)}
                    onCheckedChange={() => toggleSelection(index)}
                  />
                </TableCell>
                <TableCell>
                  {variant.id ? (
                    <Link
                      to={`variants/${variant.id}`}
                      className="hover:underline font-medium"
                    >
                      {variant.name}
                    </Link>
                  ) : (
                    variant.name
                  )}
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Controller
                    control={control}
                    name={`product.variants.${index}.sku`}
                    rules={{
                      required: "SKU is required.",
                    }}
                    render={({ field, fieldState }) => (
                      <Field>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          placeholder="Variant SKU"
                          className="w-full"
                        />
                        {fieldState.error && (
                          <FieldError>{fieldState.error?.message}</FieldError>
                        )}
                      </Field>
                    )}
                  />
                </TableCell>
                {columns?.map((col) => (
                  <TableCell key={col.id} className="px-4 py-2">
                    {col.cell(variant, index)}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );
}
