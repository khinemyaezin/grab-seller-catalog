import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldLegend,
  FieldSet,
} from "@khinemyaezin/seller-ui/components/field";
import {
  MediaGallery,
  MediaGalleryEmpty,
  MediaGalleryList,
} from "@khinemyaezin/seller-ui/components/media-gallery";
import type { ProductMedia, ProductVariantForm } from "@/features/products/types";
import { toVariantGalleryItems } from "@/features/products/lib/variant-media";

export type ProductVariantMediaFieldSetProps = {
  productMedias: ProductMedia[];
};

export default function ProductVariantMediaFieldSet({
  productMedias,
}: ProductVariantMediaFieldSetProps) {
  const { control, setValue, formState: { isSubmitting } } = useFormContext<ProductVariantForm>();
  const mediaIds = useWatch({ control, name: "mediaIds" }) ?? [];
  const assignedItems = useMemo(
    () => toVariantGalleryItems(productMedias, mediaIds),
    [productMedias, mediaIds],
  );
  const available = useMemo(
    () => productMedias.filter((media) => !mediaIds.includes(media.id)),
    [mediaIds, productMedias],
  );

  const persistSelection = (nextIds: string[]) => {
    setValue("mediaIds", nextIds, { shouldDirty: true, shouldValidate: false });
    setValue("thumbnailMediaId", nextIds[0] ?? null, { shouldDirty: true, shouldValidate: false });
  };

  return (
    <FieldSet>
      <FieldLegend>Media</FieldLegend>
      <FieldDescription>
        Assign images from the product gallery. The first image is the variant thumbnail.
      </FieldDescription>
      {productMedias.length === 0 ? (
        <MediaGalleryEmpty>
          Add images on the product first, then assign them to this variant.
        </MediaGalleryEmpty>
      ) : (
        <Field>
          <MediaGallery
            value={assignedItems}
            onChange={(items) => {
              if (!Array.isArray(items)) {
                return;
              }
              persistSelection(items.map((item) => item.id));
            }}
            featuredLabel="Thumbnail"
            disabled={isSubmitting}
          >
            {assignedItems.length === 0 ? (
              <MediaGalleryEmpty>
                No images assigned. Choose from the product gallery below.
              </MediaGalleryEmpty>
            ) : (
              <MediaGalleryList />
            )}
          </MediaGallery>
          {available.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">Select media from product gallery</p>
              <div className="flex flex-wrap gap-2">
                {available.map((media) => (
                  <button
                    key={media.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => persistSelection([...mediaIds, media.id])}
                    aria-label="Add image to variant"
                    className="size-16 sm:size-20 overflow-hidden rounded-md border bg-muted text-left transition hover:border-primary hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <img
                      src={media.url}
                      alt=""
                      className="aspect-square size-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </Field>
      )}
    </FieldSet>
  );
}
