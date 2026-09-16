import { useEffect } from "react";
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import {
  useContextBar,
  useResetAllSlots,
  useIsExtensionDirty,
} from "@khinemyaezin/seller-ui";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@khinemyaezin/seller-ui/components/card";
import type {
  ProductLifecycleEvent,
  ProductMedia,
  ProductVariantForm,
} from "@/features/products/types";
import { useProductVariantUpdateSubmit } from "./use-product-variant-update-submit";
import { PricingLineEditFullSlot } from "@/features/products/ui/slots/pricing/pricing-edit-full-slot";
import { InventoryLineEditFullSlot } from "@/features/products/ui/slots/inventory/inventory-edit-full-slot";
import { pricingEditGroupId } from "@/features/products/lib/pricing-instance-id";
import { inventoryEditGroupId } from "@/features/products/lib/inventory-group-id";
import ProductVariantFieldSet from "./product-variant-fieldset";
import ProductVariantMediaFieldSet from "./product-variant-media-fieldset";
import { ManageInventoryField, tracksInventory } from "@/features/products/ui/manage-inventory-field";
import type { HateoasLink } from "@khinemyaezin/seller-api";

export type ProductVariantEditFormProps = {
  productId: string;
  variantId: string;
  seed: ProductVariantForm;
  productMedias?: ProductMedia[];
  actions?: Record<string, HateoasLink>;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export default function ProductVariantEditForm({
  productId,
  variantId,
  seed,
  productMedias = [],
  actions,
  onLifecycleEvent,
}: ProductVariantEditFormProps) {
  const form = useForm<ProductVariantForm>({
    defaultValues: seed,
    mode: "onSubmit",
  });
  const { reset } = form;

  useEffect(() => {
    reset(seed);
  }, [reset, seed]);

  return (
    <FormProvider {...form}>
      <ProductVariantEditFormFields
        productId={productId}
        variantId={variantId}
        seed={seed}
        productMedias={productMedias}
        actions={actions}
        onLifecycleEvent={onLifecycleEvent}
      />
    </FormProvider>
  );
}

function ProductVariantEditFormFields({
  productId,
  variantId,
  seed,
  productMedias = [],
  actions,
  onLifecycleEvent,
}: ProductVariantEditFormProps) {
  const { handleSubmit, reset, formState: { isDirty }, control } = useFormContext<ProductVariantForm>();
  const [isExtensionDirty, resetExtensionDirty] = useIsExtensionDirty();
  const resetAllSlots = useResetAllSlots();

  const { submit } = useProductVariantUpdateSubmit({
    productId,
    variantId,
    seed,
    actions,
    onLifecycleEvent: (event) => {
      if (event.type === "updated") {
        resetExtensionDirty();
      }
      onLifecycleEvent?.(event);
    },
  });

  const sku = useWatch({ control, name: "sku" });
  const matrixKey = useWatch({ control, name: "matrixKey" });
  const manageInventory = useWatch({ control, name: "manageInventory" });
  const slotGroupKey = matrixKey || variantId;

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
      resetAllSlots();
      reset(seed);
      resetExtensionDirty();
    },
    groupId: `variant-edit-${variantId}`,
    label: "Edit Variant",
  });

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6 w-full">
      <Card>
        <CardContent>
          <ProductVariantFieldSet />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <ProductVariantMediaFieldSet productMedias={productMedias ?? []} />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <PricingLineEditFullSlot
            groupId={pricingEditGroupId(slotGroupKey)}
            context={{ sku: sku ?? "", variantId }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
          <CardDescription>
            Set stock by location. Confirm a stock operation, then save the variant.
          </CardDescription>
          <CardAction>
            <ManageInventoryField<ProductVariantForm> name="manageInventory" />
          </CardAction>
        </CardHeader>
        {tracksInventory(manageInventory) && (
          <CardContent>
            <InventoryLineEditFullSlot
              groupId={inventoryEditGroupId(slotGroupKey)}
              context={{ sku: sku ?? "", variantId }}
            />
          </CardContent>
        )}
      </Card>
    </form>
  );
}
