import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { configureApi } from "@khinemyaezin/seller-api";
import { server } from "@/test/server";
import { fetchCatalogRoot } from "./discovery";

describe("catalog discovery", () => {
  it("maps all catalog HAL relations into the CatalogRoot contract", async () => {
    configureApi({ baseUrl: "http://api.test" });
    server.use(http.get("http://api.test/catalog", () => HttpResponse.json({
      _links: {
        self: { href: "/catalog" },
        "search-products": { href: "/catalog/products/search" },
        "get-product": { href: "/catalog/products/{id}", templated: true },
        "get-variant": { href: "/catalog/products/{productId}/variants/{variantId}", templated: true },
        "create-product": { href: "/catalog/products" },
        "search-category-leaves": { href: "/catalog/categories/leaves" },
        "search-variant-types": { href: "/catalog/variant-types" },
        "search-variant-options": { href: "/catalog/variant-options" },
        "generate-variation-matrix": { href: "/catalog/variation-matrix" },
        "create-sellable-product": { href: "/api/v1/workflows/create-sellable-product" },
        "create-product-media-upload": { href: "/catalog/products/{productId}/media/uploads", templated: true },
        "create-staged-media-upload": { href: "/catalog/media/uploads" },
        "replace-product-media": { href: "/catalog/products/{productId}/media", templated: true },
        "update-sellable-product": { href: "/api/v1/workflows/update-sellable-product" },
        "update-product-variant": { href: "/api/v1/workflows/update-product-variant" },
      },
    }, { headers: { "content-type": "application/hal+json" } })));

    const root = await fetchCatalogRoot({ href: "/catalog" });
    
    expect(root.self?.href).toBe("/catalog");
    expect(root.searchProducts?.href).toBe("/catalog/products/search");
    expect(root.getProduct?.href).toBe("/catalog/products/{id}");
    expect(root.getProduct?.templated).toBe(true);
    expect(root.getVariant?.href).toBe("/catalog/products/{productId}/variants/{variantId}");
    expect(root.getVariant?.templated).toBe(true);
    expect(root.createProduct?.href).toBe("/catalog/products");
    expect(root.searchCategoryLeaves?.href).toBe("/catalog/categories/leaves");
    expect(root.searchVariantTypes?.href).toBe("/catalog/variant-types");
    expect(root.searchVariantOptions?.href).toBe("/catalog/variant-options");
    expect(root.generateVariationMatrix?.href).toBe("/catalog/variation-matrix");
    expect(root.createSellableProduct?.href).toBe("/api/v1/workflows/create-sellable-product");
    expect(root.createProductMediaUpload?.href).toBe("/catalog/products/{productId}/media/uploads");
    expect(root.createProductMediaUpload?.templated).toBe(true);
    expect(root.createStagedMediaUpload?.href).toBe("/catalog/media/uploads");
    expect(root.replaceProductMedia?.href).toBe("/catalog/products/{productId}/media");
    expect(root.replaceProductMedia?.templated).toBe(true);
    expect(root.updateSellableProduct?.href).toBe("/api/v1/workflows/update-sellable-product");
    expect(root.updateProductVariant?.href).toBe("/api/v1/workflows/update-product-variant");
  });
});
