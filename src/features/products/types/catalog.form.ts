import type { Product, ProductStatus, Variant, VariationType } from "./catalog.model";

export type ProductFormValue = {
  product: Product;
  variationTypes: VariationType[];
};

export type ProductFilterFormValue = {
  query: string;
  productStatus: ProductStatus | null;
  page: number;
  size: number;
};

export type ProductVariantForm = Variant;