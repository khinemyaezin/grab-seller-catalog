import { Controller, useFormContext } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldSet,
  FieldLegend,
} from "@khinemyaezin/seller-ui/components/field";
import {
  MediaGallery,
  MediaGalleryDropzone,
  MediaGalleryErrors,
  MediaGalleryList,
} from "@khinemyaezin/seller-ui/components/media-gallery";
import { PRODUCT_MEDIA_ACCEPT, PRODUCT_MEDIA_MAX_BYTES } from "@/features/products/constants/product-media";
import type { ProductFormValue } from "@/features/products/types";

export default function ProductMediaFieldSet() {
  const { control, formState: { isSubmitting } } = useFormContext<ProductFormValue>();

  return (
    <FieldSet>
      <FieldLegend>Media</FieldLegend>
      <FieldDescription>
        Optional. First image is the storefront hero.
      </FieldDescription>
      <Controller
        control={control}
        name="medias"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <MediaGallery
              value={field.value ?? []}
              onChange={field.onChange}
              accept={[...PRODUCT_MEDIA_ACCEPT]}
              maxSizeBytes={PRODUCT_MEDIA_MAX_BYTES}
              invalid={fieldState.invalid}
              disabled={isSubmitting}
            >
              <MediaGalleryDropzone />
              <MediaGalleryList />
              <MediaGalleryErrors />
            </MediaGallery>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldSet>
  );
}
