import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { catalogService } from "@/features/products/api";
import type { HateoasLink } from "@khinemyaezin/seller-api";
import type {
  CreateProductRequest,
  CreateSellableProductRequest,
  CreateSellableProductResponse,
  GetFullProductResponse,
  GetVariantRequest,
  GetVariantResponse,
  UpdateProductRequest,
  UpdateProductResponse,
  UpdateSellableProductRequest,
  UpdateSellableProductResponse,
  UpdateProductVariantRequest,
  UpdateProductVariantResponse,
  ProductModerationResponse,
  DeleteProductResponse,
  ProductFilterFormValue,
} from "@/features/products/types";
import { resolveUrlTemplate } from "@khinemyaezin/seller-api";
import { ProductSearchRequest } from "../types/catalog.request";
import { ProductSearchResponse } from "../types/catalog.response";

export function invalidateProductsQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: ["products"] });
}

export function invalidateProductDetailQueries(queryClient: QueryClient, productId: string) {
  return queryClient.invalidateQueries({ queryKey: ["product", productId] });
}

export function invalidateProductQueries(queryClient: QueryClient, productId?: string) {
  const promises = [invalidateProductsQueries(queryClient)];
  if (productId) {
    promises.push(invalidateProductDetailQueries(queryClient, productId));
  }
  return Promise.all(promises);
}

export function useProductMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { link: HateoasLink; request: CreateProductRequest }>({
    mutationFn: ({ link, request }) => catalogService.createProduct(link, request),
    onSuccess: () => {
      invalidateProductsQueries(queryClient);
    },
  });
}

export function useCreateSellableProductMutation() {
  return useMutation<
    CreateSellableProductResponse,
    Error,
    { link: HateoasLink; request: CreateSellableProductRequest }
  >({
    mutationFn: ({ link, request }) => catalogService.createSellableProduct(link, request),
  });
}

export function useUpdateSellableProductMutation() {
  return useMutation<
    UpdateSellableProductResponse,
    Error,
    { link: HateoasLink; request: UpdateSellableProductRequest }
  >({
    mutationFn: ({ link, request }) => catalogService.updateSellableProduct(link, request),
  });
}

export function useUpdateProductVariantMutation() {
  return useMutation<
    UpdateProductVariantResponse,
    Error,
    { link: HateoasLink; request: UpdateProductVariantRequest }
  >({
    mutationFn: ({ link, request }) => catalogService.updateProductVariant(link, request),
  });
}

export function useProductUpdateMutation() {
  const queryClient = useQueryClient();
  return useMutation<UpdateProductResponse, Error, { link: HateoasLink; request: UpdateProductRequest }>({
    mutationFn: ({ link, request }) => catalogService.updateProduct(link, request),
    onSuccess: () => {
      invalidateProductsQueries(queryClient);
    },
  });
}

export function useProductDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation<DeleteProductResponse, Error, { link: HateoasLink }>({
    mutationFn: ({ link }) => catalogService.deleteProduct(link),
    onSuccess: (resp) => {
      invalidateProductQueries(queryClient, resp.productId);
    },
  });
}

export function useProductRestoreMutation() {
  const queryClient = useQueryClient();
  return useMutation<ProductModerationResponse, Error, { link: HateoasLink }>({
    mutationFn: ({ link }) => catalogService.restoreProduct(link),
    onSuccess: (resp) => {
      invalidateProductQueries(queryClient, resp.productId);
    },
  });
}

export function useProductSearch(productsLink: HateoasLink, filters: ProductFilterFormValue) {
  const request: ProductSearchRequest = {
    ...filters,
    productStatus: filters.productStatus || undefined,
  };
  return useQuery<ProductSearchResponse>({
    queryKey: ["products", "search", productsLink?.href, filters],
    queryFn: async () => catalogService.searchProducts(productsLink!, request),
    enabled: !!productsLink,
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductGet(productLink: HateoasLink | undefined, productId: string) {
  const extendedLink = productLink && resolveUrlTemplate({ productId }, productLink);
  return useQuery<GetFullProductResponse, Error>({
    queryKey: ["product", productId],
    queryFn: async () => catalogService.getFullProduct(extendedLink!),
    enabled: !!productLink,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductVariantGet(
  variantLink: HateoasLink | undefined,
  request: GetVariantRequest,
) {
  const extendedLink =
    variantLink &&
    resolveUrlTemplate(
      { productId: request.productId, variantId: request.variantId },
      variantLink,
    );
  return useQuery<GetVariantResponse, Error>({
    queryKey: ["product", request.productId, "variant", request.variantId],
    queryFn: async () => catalogService.getVariant(extendedLink!),
    enabled: !!variantLink && !!request.productId && !!request.variantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductPublishMutation() {
  const queryClient = useQueryClient();

  return useMutation<ProductModerationResponse, Error, { link: HateoasLink }>({
    mutationFn: ({ link }) => catalogService.publishProduct(link),
    onSuccess: (resp) => {
      invalidateProductQueries(queryClient, resp.productId);
    },
  });
}
