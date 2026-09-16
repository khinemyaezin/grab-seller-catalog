import { useCallback } from "react";
import { Filter, type FilterField, type FilterValues } from "@khinemyaezin/seller-ui/components/filter";
import type { ProductSearchCriteria } from "./use-product-filter";
import { ProductStatus } from "@/features/products/types/catalog.model";

const PAGE_SIZES = [5, 10, 20];
const PRODUCT_STATUS: ProductStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED", "SUSPENDED"];
const ALL = "ALL";
const DEFAULT_SIZE = 5;

const FIELDS: FilterField[] = [
  {
    type: "input",
    name: "query",
    label: "",
    placeholder: "Search products",
    debounceMs: 300,
  },
   {
      type: "select",
      name: "size",
      label: "",
      placeholder: "Page size",
      options: PAGE_SIZES.map((size) => ({ label: String(size), value: String(size) })),
    },
];

const DEFAULT_VALUES: FilterValues = {
  query: "",
  productStatus: ALL,
  size: String(DEFAULT_SIZE),
};

export type ProductsFilterProps = {
  onChange: (criteria: ProductSearchCriteria) => void;
};

export default function ProductsFilter({ onChange }: ProductsFilterProps) {
  const handleChange = useCallback(
    (values: FilterValues) => {
      const query = typeof values.query === "string" ? values.query.trim() : "";
      const productStatus = values.productStatus === ALL ? null : (values.productStatus as ProductStatus);

      onChange({
        query,
        productStatus,
        size: Number(values.size ?? DEFAULT_SIZE),
      });
    },
    [onChange]
  );

  return (
    <Filter
      fields={FIELDS}
      defaultValues={DEFAULT_VALUES}
      onChange={handleChange}
      className="flex flex-wrap gap-3"
    />
  );
}
