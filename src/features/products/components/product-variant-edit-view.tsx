import { ReactNode, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@khinemyaezin/seller-ui/components/card";
import { QueryState } from "@khinemyaezin/seller-ui/components/query-state";
import { useCatalogLink } from "../hooks/use-root";
import { useProductGet } from "../hooks/use-products";
import { useProductVariantEdit } from "../hooks/use-product-variant-edit";
import ProductVariantEditForm from "./product-variant-edit-form";
import ProductVariantNav from "./product-variant-nav";
import ProductVariantActionsMenu from "./product-variant-edit-actions";
import type { Product, ProductLifecycleEvent } from "../types";
import { Header } from "@khinemyaezin/seller-ui";
import { Button } from "@khinemyaezin/seller-ui/components/button";
import { ButtonGroup } from "@khinemyaezin/seller-ui/components/button-group";
import { ArrowLeftIcon, ImageIcon } from "lucide-react";
import { Link } from "react-router";

export type ProductVariantEditViewProps = {
  productId: string;
  variantId?: string;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export default function ProductVariantEditView({
  productId,
  variantId,
  onLifecycleEvent,
}: ProductVariantEditViewProps) {
  const getProductLink = useCatalogLink("getProduct");
  const { data: product, isLoading: isProductLoading, isError: isProductError } = useProductGet(getProductLink, productId);

  const variants = product?.variants ?? [];
  const currentVariantId = variantId || variants[0]?.id || "";

  const {
    isLoading: isVariantLoading,
    isError: isVariantError,
    seed,
    actions,
  } = useProductVariantEdit({
    productId,
    variantId: currentVariantId,
  });

  useEffect(() => {
    if (seed?.name) {
      onLifecycleEvent?.({ type: "titleResolved", title: seed.name });
    }
  }, [onLifecycleEvent, seed?.name]);

  return (
    <>
      <Header
        title={seed?.name ?? "Edit Variant"}
        description="Update variant details, pricing, and inventory."
      >
        <ButtonGroup>
          <ButtonGroup>
            <Button type="button" variant="secondary" asChild>
              <Link to="../.." relative="path" className="flex gap-2 items-center">
                <ArrowLeftIcon />
              </Link>
            </Button>
          </ButtonGroup>
          <ButtonGroup>
            <ProductVariantActionsMenu productId={productId} links={actions} onLifecycleEvent={onLifecycleEvent} />
          </ButtonGroup>
        </ButtonGroup>
      </Header>
      <QueryState isLoading={isProductLoading || !product} isError={isProductError && !product}>
        {<div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-5 lg:col-span-4">
            <ProductInfoView product={product!}>
              <ProductVariantNav
                variants={variants}
                variantTypes={product?.variantTypes}
                currentVariantId={currentVariantId}
              />
            </ProductInfoView>
          </div>

          <div className="md:col-span-7 lg:col-span-8">
            {currentVariantId ? (
              <QueryState
                isLoading={isVariantLoading || !seed}
                isError={isVariantError && !seed}
              >
                {seed ? (
                  <ProductVariantEditForm
                    key={currentVariantId}
                    productId={productId}
                    variantId={currentVariantId}
                    seed={seed}
                    onLifecycleEvent={onLifecycleEvent}
                  />
                ) : null}
              </QueryState>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Select a variant to edit
                </CardContent>
              </Card>
            )}
          </div>
        </div>}
      </QueryState>
    </>
  );
}

type ProductInfoViewProps = {
  product: {
    name: string;
    variants?: unknown[];
    image?: string;
  };
  children: ReactNode;
};

function ProductInfoView({ product, children }: ProductInfoViewProps) {
  const variantCount = product.variants?.length ?? 0;

  return (
    <Card className="py-0 gap-0 overflow-hidden">
      <CardHeader className="border-b p-4 flex flex-row items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center border bg-muted overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name ?? "Product image"}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <CardTitle className="text-base font-semibold truncate leading-tight">
            {product.name}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            {variantCount} {variantCount === 1 ? "variant" : "variants"}
          </CardDescription>
        </div>
      </CardHeader>
      {children}
    </Card>
  );
}
