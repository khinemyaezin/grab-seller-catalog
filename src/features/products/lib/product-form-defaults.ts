import type { ProductFormValue } from "@/features/products/types";

export const DEFAULT_PRODUCT_FORM_VALUE: ProductFormValue = {
  product: {
    name: "",
    category: null,
    variants: [],
    standaloneVariant: {
      sku: "",
      manageInventory: false,
    },
    publicationLines: [],
  },
  variationTypes: [],
  medias: [],
  descriptions: [],
};
