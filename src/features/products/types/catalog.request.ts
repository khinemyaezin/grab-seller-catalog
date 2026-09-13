export type VariationMatrixRequestVariation = {
  typeId: string;
  optionId: string;
};

export type VariationMatrixRequestVariantType = {
  typeId: string;
  options: { optionId: string }[];
};

export type VariationMatrixRequest = {
  variantTypes: VariationMatrixRequestVariantType[];
  variants: {
    matrixKey: string;
    variations: VariationMatrixRequestVariation[];
  }[];
};

export type CreateProductRequestVariation = {
  typeId: string;
  optionId: string;
};

export type CreateProductRequestVariationType = {
  typeId: string;
  options: { optionId: string }[];
};

export type CreateProductRequestProduct = {
  name: string;
  categoryId: string;
  condition: string;
  slug: string;
  variants: {
    sku: string | undefined;
    variations: CreateProductRequestVariation[];
    manageInventory?: boolean;
  }[];
};

export type CreateProductRequest = {
  product: CreateProductRequestProduct;
  variantTypes: CreateProductRequestVariationType[];
};

export type CreateSellableProductRequest = CreateProductRequest & {
  pricingLines: CreateSellableProductPricingLine[],
  inventoryLines?: CreateSellableProductInventoryLine[],
  idempotencyKey?: string;
}

export type CreateSellableProductPricingLine = {
  sku: string;
  title?: string;
  currencyCode: string;
  amount: number;
  minQuantity?: number | null;
  maxQuantity?: number | null;
  rules?: {
    attribute: string;
    value: string;
    operator?: string;
    priority?: number;
  }[];
};

export type ProductContributions = Partial<
  Pick<CreateSellableProductRequest, "pricingLines" | "inventoryLines">
>;

export type UpdateProductContributions = Partial<
  Pick<UpdateSellableProductRequest, "pricingLines" | "inventoryLines">
>;

export type CreateSellableProductInventoryLine = {
  sku: string;
  locationId: string;
  initialQuantity: number;
  safetyStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  maxStock?: number;
};


export type UPDATE_INTENT = "LEAVE_AS_IS" | "FULL_SYNC" | "COLLAPSE_TO_STANDALONE";

export interface UpdateProductRequest {
  name: string;
  categoryId: string;
  condition: string;
  slug: string;
  variantSync: {
    intent: UPDATE_INTENT;
    overrides: {
      sku: string;
      matrixKey: string;
      variations: {
        typeId: string;
        optionId: string;
      }[];
      manageInventory?: boolean;
    }[];
    variantTypes: {
      typeId: string;
      options: {
        optionId: string;
        optionName: string;
      }[];
    }[];
  };
}

export type UpdateSellableProductInventoryLine = {
  sku: string;
  locationId?: string;
  inventoryItemId?: string;
  op: "CREATE" | "ADJUST";
  create?: {
    initialQuantity: number;
    safetyStock?: number;
    reorderPoint?: number;
    reorderQuantity?: number;
    maxStock?: number;
  };
  adjust?: {
    newOnHandQuantity: number;
    reason: string;
  };
};

export type UpdateSellableProductPricingLine = {
  sku: string;
  variantId?: string;
  title?: string;
  currencyCode: string;
  amount: number;
  minQuantity?: number | null;
  maxQuantity?: number | null;
  rules?: {
    attribute: string;
    value: string;
    operator?: string;
    priority?: number;
  }[];
};

export type UpdateSellableProductRequest = {
  productId: string;
  product: UpdateProductRequest;
  inventoryLines?: UpdateSellableProductInventoryLine[];
  pricingLines?: UpdateSellableProductPricingLine[];
  idempotencyKey?: string;
};

export type UpdateProductVariantPrice = {
  title?: string;
  currencyCode: string;
  amount: number;
  minQuantity?: number | null;
  maxQuantity?: number | null;
  rules?: {
    attribute: string;
    value: string;
    operator?: string;
    priority?: number;
  }[];
};

export type UpdateProductVariantRequest = {
  productId: string;
  variantId: string;
  sku: string;
  manageInventory?: boolean;
  price?: UpdateProductVariantPrice;
  inventoryLines?: UpdateSellableProductInventoryLine[];
  idempotencyKey?: string;
};

export interface ProductSearchRequest {
  query?: string,
  variantStatus?: string,
  categoryId?: string,
  productStatus?: string
  page: number;
  size: number;
}

export interface GetVariantRequest {
  productId: string;
  variantId: string;
}
