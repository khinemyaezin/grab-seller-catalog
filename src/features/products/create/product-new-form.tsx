import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { ProductFormValue } from "@/features/products/types";
import type { ProductLifecycleEvent } from "@/features/products/types";
import { HateoasLink } from "@khinemyaezin/seller-api";
import { useProductCreateSubmit } from "./use-product-create-submit";
import { useContextBar, useResetAllSlots, useIsExtensionDirty } from "@khinemyaezin/seller-ui";
import { Card, CardContent } from "@khinemyaezin/seller-ui/components/card";
import { PricingStandalone } from "@/features/products/ui/slots/pricing/pricing-standalone";
import { InventoryStandalone } from "@/features/products/ui/slots/inventory/inventory-standalone";
import ProductBasicFieldSet from "@/features/products/ui/product-basic-fieldset";
import ProductMediaFieldSet from "@/features/products/ui/product-media-fieldset";
import ProductNewVariation from "./product-new-variation";
import { DEFAULT_PRODUCT_FORM_VALUE } from "@/features/products/lib/product-form-defaults";
import { useMatrixSync } from "@/features/products/use-matrix-sync";
import { ProductStatus } from "@/features/products/ui/product-status";
import { SalesChannel } from "@/features/products/ui/sales-channel";

export type ProductNewFormProps = {
  link: HateoasLink;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export default function ProductNewForm(props: ProductNewFormProps) {
  const form = useForm<ProductFormValue>({
    defaultValues: DEFAULT_PRODUCT_FORM_VALUE,
    mode: "onSubmit",
  });

  return (
    <FormProvider {...form}>
      <ProductNewFormContent {...props} />
    </FormProvider>
  );
}

function ProductNewFormContent({ link, onLifecycleEvent }: ProductNewFormProps) {
  const { handleSubmit, reset, formState: { isDirty } } = useFormContext<ProductFormValue>();
  const [isExtensionDirty, resetExtensionDirty] = useIsExtensionDirty();
  const resetAllSlots = useResetAllSlots();

  const { submit } = useProductCreateSubmit({
    link,
    onLifecycleEvent: (event) => {
      if (event.type === "created" || event.type === "createMediaFailed" || event.type === "createDescriptionFailed") {
        resetExtensionDirty();
        resetAllSlots();
      }
      onLifecycleEvent?.(event);
    },
  });

  useMatrixSync();

  useContextBar({
    dirty: isDirty || isExtensionDirty,
    onSave: async () => {
      let valid = false;
      await handleSubmit(
        async () => {
          valid = true;
          await submit();
        },
        () => {
          valid = false;
        },
      )();
      if (!valid) {
        throw new Error("Form validation failed");
      }
    },
    onDiscard: () => {
      reset(DEFAULT_PRODUCT_FORM_VALUE);
      resetAllSlots();
      resetExtensionDirty();
    },
    groupId: "product-new",
    label: "New Product",
  });

  return (
    <form onSubmit={handleSubmit(submit)} className="w-full flex flex-wrap gap-6 items-start justify-center">
      <div className="w-full max-w-2xl grid gap-6">
        <Card>
          <CardContent className="flex flex-col gap-6">
            <ProductBasicFieldSet />
            <ProductMediaFieldSet />
          </CardContent>
        </Card>
        <PricingStandalone />
        <InventoryStandalone />
        <ProductNewVariation />
      </div>
      <aside className="flex-1 min-w-70 max-w-2xl grid gap-6">
        <ProductStatus />
        <SalesChannel />
      </aside>
    </form>
  );
}
