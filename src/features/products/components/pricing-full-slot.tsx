import {
  PRODUCT_EXTENSION_SLOTS,
  type PricingCreateContext,
  type PricingPayload,
} from "@khinemyaezin/seller-contracts";
import {
  FieldDescription,
  FieldLegend,
  FieldSet,
} from "@khinemyaezin/seller-ui/components/field";
import {
  PRICING_DOMAIN,
  ProductExtensionSlot,
} from "./product-extension-slot";

export type PricingLineSlotProps = {
  groupId: string;
  context: PricingCreateContext;
};

export function PricingLineFullSlot({ groupId, context }: PricingLineSlotProps) {
  return (
    <FieldSet>
      <FieldLegend>Pricing</FieldLegend>
      <FieldDescription>
        Set the price buyers will pay for this product.
      </FieldDescription>
      <div className="max-w-sm">
        <ProductExtensionSlot<PricingCreateContext, PricingPayload>
          name={PRODUCT_EXTENSION_SLOTS.CREATE_PRICING}
          domain={PRICING_DOMAIN}
          groupId={groupId}
          context={context}
        />
      </div>
    </FieldSet>
  );
}
