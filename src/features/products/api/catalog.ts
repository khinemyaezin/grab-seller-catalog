import type {
  CategoryLeavesResult,
  CreateProductRequest,
  CreateSellableProductRequest,
  CreateSellableProductResponse,
  GetFullProductResponse,
  GetVariantResponse,
  GetVariationOptionResult,
  GetVariationTypeResult,
  UpdateProductRequest,
  UpdateProductResponse,
  UpdateSellableProductRequest,
  UpdateSellableProductResponse,
  UpdateProductVariantRequest,
  UpdateProductVariantResponse,
  VariationMatrixRequest,
  VariationMatrixResponse,
  DeleteProductResponse,
  ProductModerationResponse,
  ProductSearchRequest,
  ProductSearchResponse,
} from "@/features/products/types";
import { api } from "@khinemyaezin/seller-api";
import type { HateoasLink } from "@khinemyaezin/seller-api";

export const catalogService = {
  createVariationMatrix: (link: HateoasLink, request: VariationMatrixRequest, headers?: Record<string, string>) =>
    api.followLink<VariationMatrixResponse>(link, "POST", request, undefined, headers),

  getCategories: (link: HateoasLink, headers?: Record<string, string>) =>
    api.followLink<CategoryLeavesResult>(link, "GET", undefined, undefined, headers),

  createProduct: (link: HateoasLink, request: CreateProductRequest, headers?: Record<string, string>) =>
    api.followLink<void>(link, "POST", request, undefined, headers),

  getVariationType: (link: HateoasLink, headers?: Record<string, string>) =>
    api.followLink<GetVariationTypeResult>(link, "GET", undefined, undefined, headers),

  getVariationOption: (link: HateoasLink, headers?: Record<string, string>) =>
    api.followLink<GetVariationOptionResult>(link, "GET", undefined, undefined, headers),

  searchProducts: (link: HateoasLink, request: ProductSearchRequest, headers?: Record<string, string>) => {
    const { page, size, ...body } = request;
    const params = { page: String(page), size: String(size) };
    return api.followLink<ProductSearchResponse>(link, "POST", body, params, headers);
  },

  getFullProduct: (link: HateoasLink, headers?: Record<string, string>) =>
    api.followLink<GetFullProductResponse>(link, "GET", undefined, undefined, headers),

  getVariant: (link: HateoasLink, headers?: Record<string, string>) =>
    api.followLink<GetVariantResponse>(link, "GET", undefined, undefined, headers),

  updateProduct: (link: HateoasLink, request: UpdateProductRequest, headers?: Record<string, string>) =>
    api.followLink<UpdateProductResponse>(link, "PUT", request, undefined, headers),

  deleteProduct: (link: HateoasLink, headers?: Record<string, string>) =>
    api.followLink<DeleteProductResponse>(link, "DELETE", undefined, undefined, headers),

  restoreProduct: (link: HateoasLink, headers?: Record<string, string>) =>
    api.followLink<ProductModerationResponse>(link, "POST", undefined, undefined, headers),

  publishProduct: (link: HateoasLink, headers?: Record<string, string>) =>
    api.followLink<ProductModerationResponse>(link, "POST", undefined, undefined, headers),

  createSellableProduct: (
    link: HateoasLink,
    request: CreateSellableProductRequest,
    headers?: Record<string, string>,
  ) =>
    api.followLink<CreateSellableProductResponse>(link, "POST", request, undefined, headers),

  updateSellableProduct: (
    link: HateoasLink,
    request: UpdateSellableProductRequest,
    headers?: Record<string, string>,
  ) =>
    api.followLink<UpdateSellableProductResponse>(link, "POST", request, undefined, headers),

  updateProductVariant: (
    link: HateoasLink,
    request: UpdateProductVariantRequest,
    headers?: Record<string, string>,
  ) =>
    api.followLink<UpdateProductVariantResponse>(link, "POST", request, undefined, headers),
};
