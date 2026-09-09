import { useMemo } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@khinemyaezin/seller-ui/components/card";
import { Badge, Skeleton } from "@khinemyaezin/seller-ui/components/index";
import { useCatalogLink } from "../hooks/use-root";
import { useProductGet } from "../hooks/use-products";
import ProductVariantEditForm from "./product-variant-edit-form";
import type { ProductLifecycleEvent } from "../types";

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
  const { data: product, isLoading } = useProductGet(getProductLink, productId);

  const nameMap = useMemo(() => {
    return Object.fromEntries(
      product?.variantTypes?.flatMap((t) =>
        t.options.map((o) => [o.optionId, o.optionName])
      ) ?? []
    );
  }, [product?.variantTypes]);

  const variants = product?.variants ?? [];
  const currentVariantId = variantId || variants[0]?.id || "";

  if (isLoading || !product) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-4 lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-16 mt-1" />
            </CardHeader>
            <CardContent className="p-2 space-y-2">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      <div className="md:col-span-5 lg:col-span-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Variants</CardTitle>
            <CardDescription>
              {variants.length} {variants.length === 1 ? "variant" : "variants"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {variants.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">No variants found</p>
            ) : (
              variants.map((v) => {
                const isSelected = v.id === currentVariantId;
                const variantName =
                  v.variations
                    ?.map((item) => item.optionName || nameMap[item.optionId] || "")
                    .filter(Boolean)
                    .join(" / ") || v.sku || "Variant";

                return (
                  <Link
                    key={v.id || v.matrixKey}
                    to={`/products/${productId}/variants/${v.id}`}
                    className={`flex flex-col p-3 rounded-md transition-colors text-sm ${isSelected
                        ? "bg-accent text-accent-foreground font-medium border border-primary/20 shadow-xs"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-foreground">
                        {variantName}
                      </span>
                      {v.status && (
                        <Badge
                          variant={v.status === "ACTIVE" ? "default" : "secondary"}
                          className="text-xs shrink-0"
                        >
                          {v.status}
                        </Badge>
                      )}
                    </div>
                    {v.sku && (
                      <span className="text-xs text-muted-foreground mt-0.5 truncate">
                        SKU: {v.sku}
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-7 lg:col-span-8">
        {currentVariantId ? (
          <ProductVariantEditForm
            key={currentVariantId}
            productId={productId}
            variantId={currentVariantId}
            onLifecycleEvent={onLifecycleEvent}
          />
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Select a variant to edit
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
