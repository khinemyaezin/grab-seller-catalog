import {
  PRODUCT_EXTENSION_SLOTS,
  type InventoryCreateContext,
  type InventoryPayload,
} from "@khinemyaezin/seller-contracts";
import {
  INVENTORY_DOMAIN,
  ProductExtensionSlot,
} from "./product-extension-slot";

export type InventoryLineSlotProps = {
  groupId: string;
  context: InventoryCreateContext;
};

export function InventoryLineFullSlot({ groupId, context }: InventoryLineSlotProps) {
  return (
    <ProductExtensionSlot<InventoryCreateContext, InventoryPayload>
      name={PRODUCT_EXTENSION_SLOTS.CREATE_INVENTORY}
      domain={INVENTORY_DOMAIN}
      groupId={groupId}
      context={context}
      fallback={<p>Unable to load inventory</p>}
    />
  );
}
