import type {
  ProductFormValue,
  UpdateProductRequest,
  UPDATE_INTENT,
} from "@/features/products/types";
import { generateSlug } from "@/features/products/utils";
import { tracksInventory } from "../components/manage-inventory-field";

export function determineUpdateIntent({
  hasVariationTypes,
}: {
  hasVariationTypes: boolean;
}): UPDATE_INTENT {
  if (hasVariationTypes) 
    return "FULL_SYNC"
  else 
    return "COLLAPSE_TO_STANDALONE";
}

export function buildUpdateProductRequest(
  values: ProductFormValue,
  intent: UPDATE_INTENT,
): UpdateProductRequest {
  const mappedVariants: UpdateProductRequest["variantSync"]["overrides"] =
    values.variationTypes.length > 0
      ? values.product.variants.map((variant) => ({
        sku: variant.sku,
        matrixKey: variant.matrixKey,
        variations: variant.variations.map((v) => ({
          typeId: v.typeId,
          optionId: v.optionId,
        })),
        manageInventory: tracksInventory(variant.manageInventory),
      }))
      : [{
        sku: values.product.standaloneVariant.sku ?? "",
        matrixKey: "",
        variations: [],
        manageInventory: tracksInventory(values.product.standaloneVariant.manageInventory),
      }];

  const types: UpdateProductRequest["variantSync"]["variantTypes"] =
    values.variationTypes.map((type) => ({
      typeId: type.uuid,
      options: type.options
        .filter((option) => option.uuid !== "")
        .map((option) => ({
          optionId: option.uuid,
          optionName: option.name,
        })),
    }));

  return {
    name: values.product.name,
    categoryId: values.product.category?.id || "",
    condition: "NEW",
    slug: generateSlug(values.product.name),

    variantSync: {
      intent: intent,
      overrides: mappedVariants,
      variantTypes: types,
    },
  };
}
