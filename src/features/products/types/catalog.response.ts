import type { HateoasLink, HateoasPageMetadata } from "@khinemyaezin/seller-api";
import type { CategoryLeaf } from "./catalog.model";

export interface CatalogRoot {
  self?: HateoasLink;
  searchProducts?: HateoasLink
  createProduct?: HateoasLink
  createProductMediaUpload?: HateoasLink
  createStagedMediaUpload?: HateoasLink
  replaceProductMedia?: HateoasLink
  replaceProductDescriptions?: HateoasLink
  getProduct?: HateoasLink
  getVariant?: HateoasLink
  searchCategoryLeaves?: HateoasLink
  searchVariantTypes?: HateoasLink
  searchVariantOptions?: HateoasLink
  generateVariationMatrix?: HateoasLink
  createSellableProduct?: HateoasLink
  updateSellableProduct?: HateoasLink
  updateProductVariant?: HateoasLink
  batchVariantImages?: HateoasLink
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

export type ProductPublication = {
  salesChannelId: string;
};

export interface ProductResponse {
  productId: string,
  productName: string,
  status: string,
  slug: string,
  categoryName: string,
  categoryId: string,
  thumbnail?: ProductMedia | null,
  publications?: ProductPublication[];
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
  mediaIds?: string[];
  thumbnailMediaId?: string | null;
  _links?: Record<string, HateoasLink>;
}

export type ProductMedia = {
  id: string;
  storageKey: string;
  url: string;
  contentType: string;
  rank: number;
};

export type ProductMediaUploadResponse = {
  url: string;
  method: string;
  requiredHeaders?: Record<string, string>;
  storageKey: string;
  expiresAt?: string;
  _links?: Record<string, HateoasLink>;
};

export type ReplaceProductMediaRequest = {
  medias: {
    id?: string;
    storageKey: string;
    contentType?: string;
    rank?: number;
  }[];
};

export type ReplaceProductMediaResponse = {
  productId: string;
  medias: ProductMedia[];
  _links?: Record<string, HateoasLink>;
};

export type CreateProductMediaUploadRequest = {
  filename: string;
  contentType: string;
  sizeBytes: number;
};

export type ProductDescription = {
  id?: string;
  name: string;
  title?: string;
  description: string;
};

export type BatchVariantImagesRequest = {
  mediaIds: string[];
  thumbnailMediaId?: string | null;
};

export type BatchVariantImagesResponse = {
  productId: string;
  variantId: string;
  mediaIds: string[];
  thumbnailMediaId?: string | null;
  _links?: Record<string, HateoasLink>;
};

export type ReplaceProductDescriptionsRequest = {
  descriptions: {
    id?: string;
    name: string;
    title?: string;
    description: string;
  }[];
};

export type ReplaceProductDescriptionsResponse = {
  productId: string;
  descriptions: ProductDescription[];
  _links?: Record<string, HateoasLink>;
};

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
  status: | "DRAFT" | "ACTIVE" | "ARCHIVED" | "SUSPENDED";
  slug: string;
  featured: boolean;
  descriptions: ProductDescription[] | null;
  medias: ProductMedia[] | null;
  moderationNote: null;
  variants: {
    id: string;
    sku: string;
    status: string;
    matrixKey: string;
    manageInventory?: boolean;
    mediaIds?: string[];
    thumbnailMediaId?: string | null;
    publications?: ProductPublication[];
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

export type UnpublishProductFromChannelRequest = {
  variantId: string;
  salesChannelId: string;
};

export type ProductPublicationResponse = {
  productId: string;
  publications: {
    variantId: string;
    salesChannelId: string;
  }[];
  _links?: Record<string, HateoasLink>;
};

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
