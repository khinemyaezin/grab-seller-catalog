import { useFormContext } from "react-hook-form";
import { rewritePublicationLineSku } from "@/features/products/lib/rewrite-publication-line-sku";
import type { ProductFormValue } from "@/features/products/types";

export function useRewritePublicationSku() {
  const { getValues, setValue } = useFormContext<ProductFormValue>();

  return (fromSku: string, toSku: string) => {
    if (!fromSku || fromSku === toSku) {
      return;
    }
    const current = getValues("product.publicationLines") ?? [];
    if (!current.some((line) => line.sku === fromSku)) {
      return;
    }
    setValue(
      "product.publicationLines",
      rewritePublicationLineSku(current, fromSku, toSku),
      { shouldDirty: true },
    );
  };
}
