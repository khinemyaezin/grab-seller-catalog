import { useEffect } from "react";
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import {
  useContextBar,
  useResetAllSlots,
  useIsExtensionDirty,
} from "@khinemyaezin/seller-ui";
import { Skeleton } from "@khinemyaezin/seller-ui/components/index";
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
  ProductVariantForm,
} from "../types";
import { useProductVariantEdit } from "../hooks/use-product-variant-edit";
import { useProductVariantUpdateSubmit } from "../hooks/use-product-variant-update-submit";
import { PricingLineEditFullSlot } from "./pricing-edit-full-slot";
import { InventoryLineEditFullSlot } from "./inventory-edit-full-slot";
import { pricingEditGroupId } from "../constants/pricing-instance-id";
import { inventoryEditGroupId } from "../constants/inventory-group-id";
import ProductVariantFieldSet from "./product-variant-fieldset";
import { ManageInventoryField, tracksInventory } from "./manage-inventory-field";

export type ProductVariantEditFormProps = {
  productId: string;
  variantId: string;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export default function ProductVariantEditForm({
  productId,
  variantId,
  onLifecycleEvent,
}: ProductVariantEditFormProps) {
  const { isLoading, isError, seed } = useProductVariantEdit({
    productId,
    variantId,
  });

  useEffect(() => {
    if (seed?.name) {
      onLifecycleEvent?.({ type: "titleResolved", title: seed.name });
    }
  }, [onLifecycleEvent, seed?.name]);

  if (isError && !seed) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load variant.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !seed) {
    return (
      <div className="flex w-full flex-col gap-7">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <ProductVariantEditFormContent
      productId={productId}
      variantId={variantId}
      seed={seed}
      onLifecycleEvent={onLifecycleEvent}
    />
  );
}

type ProductVariantEditFormContentProps = ProductVariantEditFormProps & {
  seed: ProductVariantForm;
};

function ProductVariantEditFormContent({
  productId,
  variantId,
  seed,
  onLifecycleEvent,
}: ProductVariantEditFormContentProps) {
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
        onLifecycleEvent={onLifecycleEvent}
      />
    </FormProvider>
  );
}

function ProductVariantEditFormFields({
  productId,
  variantId,
  seed,
  onLifecycleEvent,
}: ProductVariantEditFormContentProps) {
  const { handleSubmit, reset, formState: { isDirty }, control } = useFormContext<ProductVariantForm>();
  const [isExtensionDirty, resetExtensionDirty] = useIsExtensionDirty();
  const resetAllSlots = useResetAllSlots();

  const { submit } = useProductVariantUpdateSubmit({
    productId,
    variantId,
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
