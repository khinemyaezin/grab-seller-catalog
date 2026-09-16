import type { VariationType } from "@/features/products/types";

export function isStandaloneProductForm(
  variationTypes: VariationType[] | undefined | null,
): boolean {
  return (variationTypes?.length ?? 0) === 0;
}
