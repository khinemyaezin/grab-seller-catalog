import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { ProductFormValue } from "../types";
import type { ProductLifecycleEvent } from "../types";
import { HateoasLink } from "@khinemyaezin/seller-api";
import { useProductCreateSubmit } from "@/features/products/hooks/use-product-create-submit";
import { useContextBar, useResetAllSlots, useIsExtensionDirty } from "@khinemyaezin/seller-ui";
import { Card, CardContent } from "@khinemyaezin/seller-ui/components/card";
import { PricingStandalone } from "./pricing-standalone";
import { InventoryStandalone } from "./inventory-standalone";
import ProductBasicFieldSet from "./product-basic-fieldset";
import ProductNewVariation from "./product-new-variation";
import { useMatrixSync } from "../hooks/use-matrix-sync";

export type ProductNewFormProps = {
  link: HateoasLink;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

const DEFAULT_PRODUCT_FORM_VALUE: ProductFormValue = {
  product: {
    name: "",
    category: null,
    variants: [],
    standaloneVariant: {
      sku: "",
      manageInventory: false,
    },
  },
  variationTypes: [],
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
      if (event.type === "created") {
        resetExtensionDirty();
      }
      onLifecycleEvent?.(event);
    },
    onSuccess: () => {
      resetAllSlots();
      reset(DEFAULT_PRODUCT_FORM_VALUE);
      resetExtensionDirty();
    }
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

    },
    groupId: "product-new",
    label: "New Product",
  });

  return (
    <form onSubmit={handleSubmit(submit)}>
      <div className="flex flex-col gap-6">
        <Card className="flex-1 w-full">
          <CardContent>
            <ProductBasicFieldSet />
          </CardContent>
        </Card>
        <PricingStandalone />
        <InventoryStandalone />
        <ProductNewVariation />
      </div>
    </form>
  );
}
