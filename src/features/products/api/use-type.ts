import { catalogService } from ".";
import type { HateoasLink } from "@khinemyaezin/seller-api";
import { GetVariationTypeResult } from "@/features/products/types";
import { useQuery } from "@tanstack/react-query";
import { resolveUrlTemplate } from "@khinemyaezin/seller-api";

export function useVariationType(variantTypesLink: HateoasLink | undefined, name: string) {
  const expendLink = variantTypesLink && resolveUrlTemplate({ "name": name }, variantTypesLink);

  return useQuery<GetVariationTypeResult>({
    queryKey: ["types", variantTypesLink?.href, name],
    queryFn: async () => catalogService.getVariationType(expendLink!),
    enabled: !!variantTypesLink && !!name?.trim(),
    staleTime: 1000 * 60 * 5,
  });
}
