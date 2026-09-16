
import { useQuery } from "@tanstack/react-query";
import { catalogService } from ".";
import type { HateoasLink } from "@khinemyaezin/seller-api";
import type { CategoryLeavesResult } from "@/features/products/types";
import { resolveUrlTemplate } from "@khinemyaezin/seller-api";

export function useCategoryLeaveSearch(categoriesLink: HateoasLink | undefined, search: string) {
  const expendLink = categoriesLink && resolveUrlTemplate({ "name": search }, categoriesLink)
  return useQuery<CategoryLeavesResult, Error>({
    queryKey: ["categories", expendLink, search],
    queryFn: async () => catalogService.getCategories(expendLink!),
    enabled: !!categoriesLink && !!search?.trim(),
    staleTime: 1000 * 60 * 5,
  });
}
