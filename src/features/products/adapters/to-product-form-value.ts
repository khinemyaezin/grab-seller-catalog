import { toMediaGalleryItems } from "@khinemyaezin/seller-ui/components/media-gallery";
import { toProductDescriptionFormItems } from "@/features/products/api/product-descriptions";
import type {
  GetFullProductResponse,
  ProductFormValue,
  ProductMedia,
  ProductMediaFormItem,
} from "@/features/products/types";

function getVariantName(
  variant: { variations: { optionId: string }[] },
  nameMap: Record<string, string>,
): string {
  return variant.variations
    .map((variation) => nameMap[variation.optionId] ?? "")
    .filter(Boolean)
    .join(" / ") || "";
}

export function toProductMediaFormItems(
  medias: ProductMedia[] | null | undefined,
): ProductMediaFormItem[] {
  return toMediaGalleryItems(medias);
}

export function transformProductToFormValue(apiData: GetFullProductResponse): ProductFormValue {
  const nameMap = Object.fromEntries(
    apiData.variantTypes.flatMap((type) =>
      type.options.map((option) => [option.optionId, option.optionName]),
    ),
  );

  const standaloneVariant =
    apiData.variantTypes.length == 0
    && apiData.variants.find((variant) => variant.variations.length === 0);

  return {
    product: {
      name: apiData.name,
      category: apiData.category ?? null,
      variants: apiData.variants.map((variant) => ({
        id: variant.id,
        name: getVariantName(variant, nameMap),
        matrixKey: variant.matrixKey,
        sku: variant.sku,
        price: "",
        manageInventory: variant.manageInventory === true,
        variations: variant.variations.map((relation) => ({
          typeId: relation.typeId,
          optionId: relation.optionId,
        })),
      })),
      standaloneVariant: standaloneVariant
        ? {
            ...standaloneVariant,
            manageInventory: standaloneVariant.manageInventory === true,
          }
        : {
            sku: "",
            manageInventory: false,
          },
    },
    variationTypes: apiData.variantTypes.map((variantType) => ({
      uuid: variantType.typeId,
      name: variantType.typeName,
      options: [
        ...variantType.options.map((option) => ({
          uuid: option.optionId,
          name: option.optionName,
        })),
        { uuid: "", name: "" },
      ],
    })),
    medias: toProductMediaFormItems(apiData.medias),
    descriptions: toProductDescriptionFormItems(apiData.descriptions),
  };
}
