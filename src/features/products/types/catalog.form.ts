import type { MediaGalleryItem } from "@khinemyaezin/seller-ui/components/media-gallery";
import type { Product, ProductStatus, Variant, VariationType } from "./catalog.model";

export type ProductMediaFormItem = MediaGalleryItem & {
  storageKey?: string;
};

export type ProductFormValue = {
  product: Product;
  variationTypes: VariationType[];
  medias: ProductMediaFormItem[];
};

export type ProductFilterFormValue = {
  query: string;
  productStatus: ProductStatus | null;
  page: number;
  size: number;
};

export type ProductVariantForm = Variant;