import type { ReactNode } from "react";
import {
  PRODUCT_EXTENSION_SLOTS,
  PRICING_DOMAIN,
  PRICING_EDIT_DOMAIN,
  INVENTORY_DOMAIN,
  INVENTORY_EDIT_DOMAIN,
  type ProductExtensionSlotName,
} from "@khinemyaezin/seller-contracts";
import {
  ExtensionSlot,
  useSlotDraft,
  useSlotErrors,
  type ExtensionSlotProps,
} from "@khinemyaezin/seller-ui";

export type ProductExtensionSlotProps<TContext, TPayload> = {
  name: ProductExtensionSlotName;
  domain: string;
  groupId: string;
  context: TContext;
  variant?: ExtensionSlotProps["variant"];
  optional?: boolean;
  fallback?: ReactNode;
};

export function ProductExtensionSlot<TContext, TPayload>({
  name,
  domain,
  groupId,
  context,
  variant,
  optional,
  fallback,
}: ProductExtensionSlotProps<TContext, TPayload>) {
  const { initialValue, onChange } = useSlotDraft<TPayload>(domain, groupId);
  const errors = useSlotErrors(groupId);
  const message = Object.values(errors)[0];

  return (
    <div className="grid gap-1">
      <ExtensionSlot
        name={name}
        optional={optional}
        variant={variant}
        fallback={fallback}
        props={{
          groupId,
          context,
          initialValue,
          onChange,
        }}
      />
      {message ? (
        <p className="text-sm text-destructive">{message}</p>
      ) : null}
    </div>
  );
}

export {
  PRODUCT_EXTENSION_SLOTS,
  PRICING_DOMAIN,
  PRICING_EDIT_DOMAIN,
  INVENTORY_DOMAIN,
  INVENTORY_EDIT_DOMAIN,
};
