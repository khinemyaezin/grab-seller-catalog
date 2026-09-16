
import { useQuery } from "@tanstack/react-query";
import { fetchCatalogRoot } from "./discovery";
import type { CatalogRoot } from "@/features/products/types";
import { useEntryLink } from "@khinemyaezin/seller-ui";

export function useRoot() {
  const entryLink = useEntryLink();

  return useQuery<CatalogRoot>({
    queryKey: ["catalog-root", entryLink?.href],
    queryFn: () => fetchCatalogRoot(entryLink),
    enabled: !!entryLink,
    staleTime: Infinity,
  });
}

export function useCatalogLink(rel: keyof CatalogRoot) {
  return useRoot().data?.[rel];
}
