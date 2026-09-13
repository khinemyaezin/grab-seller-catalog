import { api, resolveLink, type HalLinks, type HateoasLink } from "@khinemyaezin/seller-api";
import type { CatalogRoot } from "../types";

type RootResponse = { _links: HalLinks };

export async function fetchCatalogRoot(link: HateoasLink): Promise<CatalogRoot> {
  const response = await api.followLink<RootResponse>(link);
  return {
    self: resolveLink(response._links, "self"),
    searchProducts: resolveLink(response._links, "search-products"),
    getProduct: resolveLink(response._links, "get-product"),
    getVariant: resolveLink(response._links, "get-variant"),
    createProduct: resolveLink(response._links, "create-product"),
    searchCategoryLeaves: resolveLink(response._links, "search-category-leaves"),
    searchVariantTypes: resolveLink(response._links, "search-variant-types"),
    searchVariantOptions: resolveLink(response._links, "search-variant-options"),
    generateVariationMatrix: resolveLink(response._links, "generate-variation-matrix"),
    createSellableProduct: resolveLink(response._links, "create-sellable-product"),
    updateSellableProduct: resolveLink(response._links, "update-sellable-product"),
    updateProductVariant: resolveLink(response._links, "update-product-variant"),
  };
}
