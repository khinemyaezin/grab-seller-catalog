import {
  PRODUCT_EXTENSION_SLOTS,
  type PricingEditContext,
  type PricingEditPayload,
} from "@khinemyaezin/seller-contracts";
import {
  FieldDescription,
  FieldLegend,
  FieldSet,
} from "@khinemyaezin/seller-ui/components/field";
import {
  PRICING_EDIT_DOMAIN,
  ProductExtensionSlot,
} from "./product-extension-slot";

export type PricingLineSlotProps = {
  groupId: string;
  context: PricingEditContext;
};

export function PricingLineEditFullSlot({ groupId, context }: PricingLineSlotProps) {
  return (
    <FieldSet>
      <FieldLegend>Pricing</FieldLegend>
      <FieldDescription>
        Set the price buyers will pay for this product.
      </FieldDescription>
      <div className="max-w-sm">
        <ProductExtensionSlot<PricingEditContext, PricingEditPayload>
          name={PRODUCT_EXTENSION_SLOTS.EDIT_PRICING}
          domain={PRICING_EDIT_DOMAIN}
          groupId={groupId}
          context={context}
        />
      </div>
    </FieldSet>
  );
}
