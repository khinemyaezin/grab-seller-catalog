import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@khinemyaezin/seller-ui/components/card";
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@khinemyaezin/seller-ui/components/item";
import { RadioGroup, RadioGroupItem } from "@khinemyaezin/seller-ui/components/radio-group";
import type { GetFullProductResponse } from "../types";

export type ProductVariantNavProps = {
  variants: GetFullProductResponse["variants"];
  variantTypes?: GetFullProductResponse["variantTypes"];
  currentVariantId: string;
  onSelect?: (variantId: string) => void;
};

export function ProductVariantNav({
  variants,
  variantTypes,
  currentVariantId,
  onSelect,
}: ProductVariantNavProps) {
  const navigate = useNavigate();

  const nameMap = useMemo(() => {
    return Object.fromEntries(
      variantTypes?.flatMap((t) =>
        t.options.map((o) => [o.optionId, o.optionName])
      ) ?? []
    );
  }, [variantTypes]);

  const handleValueChange = (id: string) => {
    if (onSelect) {
      onSelect(id);
    } else {
      navigate(`../${id}`, { relative: "path" });
    }
  };

  if (variants.length === 0) {
    return <p className="px-6 py-4 text-sm text-muted-foreground">No variants found</p>
  }

  return (
    <RadioGroup
      value={currentVariantId}
      onValueChange={handleValueChange}
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
              className={`cursor-pointer rounded-none border-0 transition-colors ${isSelected
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

  );
}

export default ProductVariantNav;
