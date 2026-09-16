import { useCallback, useState } from "react";
import type { ProductFilterFormValue } from "@/features/products/types";

const DEFAULT_FILTER: ProductFilterFormValue = {
  query: "",
  productStatus: null,
  page: 0,
  size: 5,
};

export type ProductSearchCriteria = Pick<ProductFilterFormValue, "query" | "productStatus" | "size">;

export function useProductFilter(initial?: Partial<ProductFilterFormValue>) {
  const [filter, setFilter] = useState<ProductFilterFormValue>({ ...DEFAULT_FILTER, ...initial });

  const updateCriteria = useCallback((criteria: ProductSearchCriteria) => {
    setFilter((prev) => ({ ...prev, ...criteria, page: 0 }));
  }, []);

  const updatePage = useCallback((page: number) => {
    setFilter((prev) => ({ ...prev, page }));
  }, []);

  return { filter, updateCriteria, updatePage } as const;
}
