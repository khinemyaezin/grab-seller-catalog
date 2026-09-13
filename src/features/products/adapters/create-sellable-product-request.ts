import type {
  CreateProductRequest,
  CreateSellableProductRequest,
  ProductFormValue,
} from "@/features/products/types";
import { generateSlug } from "@/features/products/utils";
import { ProductContributions } from "../types/catalog.request";
import { tracksInventory } from "../components/manage-inventory-field";

export function buildCreateProductRequest(
  values: ProductFormValue,
): CreateProductRequest {
  const hasVariations = values.variationTypes.length > 0;

  const mappedVariants = hasVariations
    ? values.product.variants.map((variant) => ({
      sku: variant.sku,
      variations: variant.variations.map((variation) => ({
        typeId: variation.typeId,
        optionId: variation.optionId,
      })),
      manageInventory: tracksInventory(variant.manageInventory),
    }))
    : [{
      sku: values.product.standaloneVariant.sku ?? "",
      variations: [],
      manageInventory: tracksInventory(values.product.standaloneVariant.manageInventory),
    }];

  return {
    product: {
      name: values.product.name,
      categoryId: values.product.category?.id || "",
      condition: "NEW",
      slug: generateSlug(values.product.name),
      variants: mappedVariants,
    },
    variantTypes: values.variationTypes.map((type) => ({
      typeId: type.uuid,
      options: type.options
        .filter((option) => option.uuid !== "")
        .map((option) => ({
          optionId: option.uuid,
        })),
    })),
  };
}


export function buildCreateSellableProductRequest(
  values: ProductFormValue,
  contributions: ProductContributions = {},
): CreateSellableProductRequest {
  return {
    ...buildCreateProductRequest(values),
    pricingLines: [],
    inventoryLines: [],
    ...contributions,
  };
}
