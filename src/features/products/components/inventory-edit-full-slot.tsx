import {
  InventoryEditContext,
  InventoryEditPayload,
  PRODUCT_EXTENSION_SLOTS,
} from "@khinemyaezin/seller-contracts";
import {
  INVENTORY_EDIT_DOMAIN,
  ProductExtensionSlot,
} from "./product-extension-slot";

export type InventoryLineEditFullSlotProps = {
  groupId: string;
  context: InventoryEditContext;
};

export function InventoryLineEditFullSlot({ groupId, context }: InventoryLineEditFullSlotProps) {
  return (
    <ProductExtensionSlot<InventoryEditContext, InventoryEditPayload>
      name={PRODUCT_EXTENSION_SLOTS.EDIT_INVENTORY}
      domain={INVENTORY_EDIT_DOMAIN}
      groupId={groupId}
      context={context}
      fallback={<p>Unable to load inventory</p>}
    />
  );
}
