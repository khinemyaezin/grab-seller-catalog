import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import type {
  GetVariantResponse,
  ProductLifecycleEvent,
  ProductVariantForm,
} from "../types";
import { useProductVariantGet } from "./use-products";
import { useCatalogLink } from "./use-root";

export const DEFAULT_PRODUCT_VARIANT_FORM_VALUE: ProductVariantForm = {
  id: "",
  name: "",
  matrixKey: "",
  sku: "",
  manageInventory: false,
  variations: [],
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
  };
}

export type UseProductVariantEditProps = {
  productId: string;
  variantId: string;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export function useProductVariantEdit({
  productId,
  variantId,
  onLifecycleEvent,
}: UseProductVariantEditProps) {
  const { reset } = useFormContext<ProductVariantForm>();
  const getVariantLink = useCatalogLink("getVariant");
  const { data, isLoading, refetch } = useProductVariantGet(getVariantLink, {
    productId,
    variantId,
  });

  useEffect(() => {
    if (data) {
      const formValue = transformVariantToFormValue(data);
      reset(formValue);
      if (formValue.name) {
        onLifecycleEvent?.({ type: "titleResolved", title: formValue.name });
      }
    }
  }, [data, reset, onLifecycleEvent]);

  return {
    isLoading,
    refetch,
    status: data?.status,
    actions: data?._links,
    data,
  };
}
