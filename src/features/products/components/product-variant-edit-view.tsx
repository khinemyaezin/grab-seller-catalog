import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@khinemyaezin/seller-ui/components/card";
import { Skeleton } from "@khinemyaezin/seller-ui/components/index";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@khinemyaezin/seller-ui/components/item";
import { RadioGroup, RadioGroupItem } from "@khinemyaezin/seller-ui/components/radio-group";
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
  const navigate = useNavigate();
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
        <div className="md:col-span-5 lg:col-span-4">
          <Card className="py-0 gap-0 overflow-hidden">
            <CardHeader className="border-b py-5">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-16 mt-1" />
            </CardHeader>
            <ItemGroup className="gap-0 divide-y divide-border">
              <Item className="rounded-none border-0">
                <ItemContent>
                  <Skeleton className="h-5 w-20" />
                </ItemContent>
              </Item>
              <Item className="rounded-none border-0">
                <ItemContent>
                  <Skeleton className="h-5 w-16" />
                </ItemContent>
              </Item>
            </ItemGroup>
          </Card>
        </div>
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      <div className="md:col-span-5 lg:col-span-4">
        <Card className="py-0 gap-0 overflow-hidden">
          <CardHeader className="border-b py-5">
            <CardTitle className="text-base font-semibold">Variants</CardTitle>
            <CardDescription>
              {variants.length} {variants.length === 1 ? "variant" : "variants"}
            </CardDescription>
          </CardHeader>
          {variants.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">No variants found</p>
          ) : (
            <RadioGroup
              value={currentVariantId}
              onValueChange={(id) => navigate(`/products/${productId}/variants/${id}`)}
            >
              <ItemGroup className="gap-0 divide-y divide-border">
                {variants.map((v) => {
                  const isSelected = v.id === currentVariantId;
                  const variantName =
                    v.variations
                      ?.map((item) => item.optionName || nameMap[item.optionId] || "")
                      .filter(Boolean)
                      .join(" / ") || v.sku || "Variant";

                  return (
                    <Item
                      key={v.id || v.matrixKey}
                      asChild
                      variant={isSelected ? "muted" : "default"}
                      className={`cursor-pointer rounded-none border-0 transition-colors ${
                        isSelected
                          ? "bg-muted text-foreground font-medium"
                          : "bg-card text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <label htmlFor={`variant-${v.id}`}>
                        <RadioGroupItem value={v.id} id={`variant-${v.id}`} hidden />
                        <ItemContent>
                          <ItemTitle className="select-none">
                            {variantName}
                          </ItemTitle>
                        </ItemContent>
                      </label>
                    </Item>
                  );
                })}
              </ItemGroup>
            </RadioGroup>
          )}
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
