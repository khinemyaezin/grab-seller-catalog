import { useMemo } from "react";
import type { GetVariantResponse, ProductVariantForm } from "@/features/products/types";
import { useProductVariantGet } from "@/features/products/api/use-products";
import { useCatalogLink } from "@/features/products/api/use-root";
import { orderVariantMediaIds } from "@/features/products/lib/variant-media";

export const DEFAULT_PRODUCT_VARIANT_FORM_VALUE: ProductVariantForm = {
  id: "",
  name: "",
  matrixKey: "",
  sku: "",
  manageInventory: false,
  variations: [],
  mediaIds: [],
  thumbnailMediaId: null,
};

export const DEFAULT_VARIANT_FORM: ProductVariantForm = DEFAULT_PRODUCT_VARIANT_FORM_VALUE;

export function getVariantName(apiData: GetVariantResponse): string {
  const variationName = apiData.variations
    ?.map((v) => v.optionName)
    .filter(Boolean)
    .join(" / ");
  return variationName || apiData.productName || "";
}

export function transformVariantToFormValue(apiData: GetVariantResponse): ProductVariantForm {
  const mediaIds = orderVariantMediaIds(apiData.mediaIds, apiData.thumbnailMediaId);
  return {
    id: apiData.variantId,
    name: getVariantName(apiData),
    matrixKey: apiData.matrixKey ?? "",
    sku: apiData.sku ?? "",
    manageInventory: apiData.manageInventory === true,
    variations: (apiData.variations ?? []).map((v) => ({
      typeId: v.typeId,
      optionId: v.optionId,
    })),
    mediaIds,
    thumbnailMediaId: apiData.thumbnailMediaId ?? mediaIds[0] ?? null,
  };
}

export type UseProductVariantEditProps = {
  productId: string;
  variantId: string;
};

export function useProductVariantEdit({
  productId,
  variantId,
}: UseProductVariantEditProps) {
  const getVariantLink = useCatalogLink("getVariant");
  const { data, isLoading, isError } = useProductVariantGet(getVariantLink, {
    productId,
    variantId,
  });

  const seed = useMemo(
    () => (data ? transformVariantToFormValue(data) : null),
    [data],
  );

  return {
    isLoading,
    isError,
    seed,
    status: data?.status,
    actions: data?._links,
    data,
  };
}
