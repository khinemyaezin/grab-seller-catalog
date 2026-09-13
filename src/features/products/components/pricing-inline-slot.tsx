import {
  PRODUCT_EXTENSION_SLOTS,
  type PricingCreateContext,
  type PricingPayload,
} from "@khinemyaezin/seller-contracts";
import {
  PRICING_DOMAIN,
  ProductExtensionSlot,
} from "./product-extension-slot";

export type PricingLineSlotProps = {
  groupId: string;
  context: PricingCreateContext;
};

export function PricingInlineSlot({ groupId, context }: PricingLineSlotProps) {
  return (
    <div className="max-w-sm">
      <ProductExtensionSlot<PricingCreateContext, PricingPayload>
        name={PRODUCT_EXTENSION_SLOTS.CREATE_PRICING}
        domain={PRICING_DOMAIN}
        groupId={groupId}
        context={context}
        variant="inline"
      />
    </div>
  );
}
