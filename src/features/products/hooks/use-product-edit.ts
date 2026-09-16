import { useMemo } from "react";
import { ProductFormValue } from "../types";
import { transformProductToFormValue } from "@/features/products/adapters/to-product-form-value";
import { useProductGet } from "./use-products";
import { useCatalogLink } from "./use-root";

export const DEFAULT_PRODUCT_FORM_VALUE: ProductFormValue = {
    product: {
        name: "",
        category: null,
        variants: [],
        standaloneVariant: {
            sku: "",
            manageInventory: false,
        }
    },
    variationTypes: [],
    medias: [],
    descriptions: [],
};

export type UseProductEditProps = {
    productId: string;
};

export function useProductEdit({ productId }: UseProductEditProps) {
    const getProductLink = useCatalogLink("getProduct");
    const { data, isLoading, isError } = useProductGet(getProductLink, productId);

    const seed = useMemo(
        () => (data ? transformProductToFormValue(data) : null),
        [data],
    );

    return { isLoading, isError, seed, status: data?.status, actions: data?._links };
}
