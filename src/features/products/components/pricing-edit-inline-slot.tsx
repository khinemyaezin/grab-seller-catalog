import {
  PRODUCT_EXTENSION_SLOTS,
  type PricingEditContext,
  type PricingEditPayload,
} from "@khinemyaezin/seller-contracts";
import {
  PRICING_EDIT_DOMAIN,
  ProductExtensionSlot,
} from "./product-extension-slot";

export type PricingEditInlineSlotProps = {
  groupId: string;
  context: PricingEditContext;
};

export function PricingEditInlineSlot({ groupId, context }: PricingEditInlineSlotProps) {
  return (
    <div className="max-w-sm">
      <ProductExtensionSlot<PricingEditContext, PricingEditPayload>
        name={PRODUCT_EXTENSION_SLOTS.EDIT_PRICING}
        domain={PRICING_EDIT_DOMAIN}
        groupId={groupId}
        context={context}
        variant="inline"
      />
    </div>
  );
}
