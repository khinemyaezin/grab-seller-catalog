import { useMemo } from "react";
import { transformProductToFormValue } from "@/features/products/lib/to-product-form-value";
import { useProductGet } from "@/features/products/api/use-products";
import { useCatalogLink } from "@/features/products/api/use-root";

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

    return { isLoading, isError, seed, status: data?.status, actions: data?._links, publications: data?.publications };
}
