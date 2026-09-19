import type {
  CreateProductRequest,
  CreateSellableProductRequest,
  ProductFormValue,
} from "@/features/products/types";
import { generateSlug } from "./utils";
import { ProductContributions } from "@/features/products/types/catalog.request";
import { tracksInventory } from "@/features/products/ui/manage-inventory-field";
import { toReplaceMediaPayload } from "@/features/products/api/product-media";
import { toReplaceDescriptionsPayload } from "@/features/products/api/product-descriptions";

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
      status: values.product.status,
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
    publicationLines: values.product.publicationLines ?? [],
    medias: toReplaceMediaPayload(values.medias ?? []),
    descriptions: toReplaceDescriptionsPayload(values.descriptions),
  };
}
