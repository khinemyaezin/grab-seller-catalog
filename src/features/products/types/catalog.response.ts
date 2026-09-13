import type { HateoasLink, HateoasPageMetadata } from "@khinemyaezin/seller-api";
import type { CategoryLeaf } from "./catalog.model";

export interface CatalogRoot {
  self?: HateoasLink;
  searchProducts?: HateoasLink
  createProduct?: HateoasLink
  getProduct?: HateoasLink
  getVariant?: HateoasLink
  searchCategoryLeaves?: HateoasLink
  searchVariantTypes?: HateoasLink
  searchVariantOptions?: HateoasLink
  generateVariationMatrix?: HateoasLink
  createSellableProduct?: HateoasLink
  updateSellableProduct?: HateoasLink
  updateProductVariant?: HateoasLink
}

export type VariationMatrixResponseVariation = {
  optionId: string;
  typeId: string;
};

export type VariationMatrixResponseVariantType = {
  typeId: string;
  options: { optionId: string }[];
};

export type VariationMatrixResponse = {
  variants: {
    matrixKey: string;
    originalMatrixKey: string;
    variations: VariationMatrixResponseVariation[];
  }[];
  collapsedSku: string[];
  variantTypes: VariationMatrixResponseVariantType[];
};

export type CreateProductResponse = {};

export interface UpdateProductResponse { }

export interface ProductResponse {
  productId: string,
  productName: string,
  status: string,
  slug: string,
  categoryName: string,
  categoryId: string,
  _links?: Record<string, HateoasLink>;
}

export interface ProductSearchResponse {
  _embedded?: {
    productSearchResponseList: ProductResponse[];
  };
  _links?: Record<string, HateoasLink>;
  page: HateoasPageMetadata;
}

export interface GetVariantResponse {
  productId: string;
  productName: string;
  variantId: string;
  sku: string;
  status: string;
  matrixKey: string;
  variations: {
    optionId: string;
    optionName: string;
    typeId: string;
    typeName: string;
  }[];
  manageInventory: boolean;
  _links?: Record<string, HateoasLink>;
}

export interface GetFullProductResponse {
  id: string;
  name: string;
  _links?: Record<string, HateoasLink>;
  category: {
    id: string;
    name: string;
  };
  sellerId: string;
  sellerType: string;
  condition: string;
  offerEligible: boolean;
  status: string;
  slug: string;
  featured: boolean;
  descriptions: null;
  medias: null;
  moderationNote: null;
  variants: {
    id: string;
    sku: string;
    status: string;
    matrixKey: string;
    manageInventory?: boolean;
    variations: {
      optionId: string;
      optionName: string;
      typeId: string;
      typeName: string;
    }[];
  }[];
  variantTypes: {
    typeId: string;
    typeName: string;
    options: {
      optionId: string;
      optionName: string;
    }[];
  }[];
}

export interface CategoryLeavesResult {
  leaves: CategoryLeaf[];
  _links?: Record<string, HateoasLink>;
}

export interface GetVariationTypeResult {
  types: {
    id: string;
    name: string;
  }[];
  _links?: Record<string, HateoasLink>;
}

export interface GetVariationOptionResult {
  options: {
    id: string;
    name: string;
    typeId: string;
    typeName: string;
  }[];
  _links?: Record<string, HateoasLink>;
}
export interface ProductModerationResponse {
  productId: string;
  action: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
}

export interface DeleteProductResponse {
  productId: string,
  deleted: boolean

}

export interface WorkflowsRoot {
  self?: HateoasLink;
  createSellableProduct?: HateoasLink;
  getCreateSellableProduct?: HateoasLink;
  updateSellableProduct?: HateoasLink;
  getUpdateSellableProduct?: HateoasLink;
  updateProductVariant?: HateoasLink;
  getUpdateProductVariant?: HateoasLink;
}

export type CreateSellableProductResponse = {
  workflowId: string;
  status: string;
  currentStep?: string | null;
  productId?: string | null;
  pricePairs?: {
    variantId: string;
    sku: string;
    priceSetId: string;
  }[];
  inventoryItemIds?: string[];
  errorMessage?: string | null;
  _links?: Record<string, HateoasLink>;
};

export type UpdateSellableProductResponse = CreateSellableProductResponse;

export type UpdateProductVariantResponse = {
  workflowId: string;
  status: string;
  currentStep?: string | null;
  productId?: string | null;
  variantId?: string | null;
  sku?: string | null;
  variantUpdated?: boolean;
  pricePair?: {
    variantId: string;
    sku: string;
    priceSetId: string;
  } | null;
  inventoryItemIds?: string[];
  compensatedPriceSetCount?: number;
  partiallyApplied?: boolean;
  errorMessage?: string | null;
  _links?: Record<string, HateoasLink>;
};
