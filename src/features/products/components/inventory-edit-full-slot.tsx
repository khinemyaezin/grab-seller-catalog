import {
  InventoryEditContext,
  InventoryEditPayload,
  PRODUCT_EXTENSION_SLOTS,
} from "@khinemyaezin/seller-contracts";
import { ExtensionSlot } from "@khinemyaezin/seller-ui";
import {
  FieldDescription,
  FieldLegend,
  FieldSet,
} from "@khinemyaezin/seller-ui/components/field";
import { useSlotDraft } from "../context/extension-sync-store";
import { INVENTORY_EDIT_DOMAIN } from "../hooks/use-inventory-edit-slots-sync";

export type InventoryLineEditFullSlotProps = {
  groupId: string
  context: InventoryEditContext
};

export function InventoryLineEditFullSlot({ groupId, context }: InventoryLineEditFullSlotProps) {
  const { initialValue, onChange } = useSlotDraft<InventoryEditPayload>(INVENTORY_EDIT_DOMAIN, groupId);

  return (
    <FieldSet>
      <FieldLegend>Inventory</FieldLegend>
      <FieldDescription>
        Set initial stock and safety stock for each location.
      </FieldDescription>

      <ExtensionSlot
        name={PRODUCT_EXTENSION_SLOTS.EDIT_INVENTORY}
        fallback={(<p>Unable to load inventory</p>)}
        props={{
          groupId,
          context,
          initialValue,
          onChange,
        }}
      />
    </FieldSet>
  );
}
