import { useState, type ReactNode } from "react";
import { Store } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { Button } from "@khinemyaezin/seller-ui/components/button";
import { Switch } from "@khinemyaezin/seller-ui/components/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@khinemyaezin/seller-ui/components/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@khinemyaezin/seller-ui/components/field";
import { useSalesChannelLink } from "@/features/products/api/sales-channel-link";
import { useSalesChannels } from "@/features/products/api/use-sales-channels";
import { isSellerFacingChannel, salesChannelLabel } from "@/features/products/lib/sales-channel-label";
import type { ProductFormValue, UpdateSellableProductPublicationLine } from "@/features/products/types";

export type VariantSalesChannelControlProps = {
  sku: string;
  trigger?: (count: number) => ReactNode;
};

function asPublicationLines(value: unknown): UpdateSellableProductPublicationLine[] {
  return Array.isArray(value) ? value : [];
}

export function VariantSalesChannelControl({ sku, trigger }: VariantSalesChannelControlProps) {
  const { control, setValue } = useFormContext<ProductFormValue>();
  const publicationLines = asPublicationLines(
    useWatch({ control, name: "product.publicationLines" }),
  );
  const salesChannelLink = useSalesChannelLink();
  const { data: channels = [] } = useSalesChannels(salesChannelLink);
  const [open, setOpen] = useState(false);

  const rows = channels.filter((channel) => isSellerFacingChannel(channel.type));
  if (rows.length === 0) {
    return null;
  }

  const publishedIds = new Set(
    publicationLines
      .filter((line) => line.sku === sku)
      .map((line) => line.salesChannelId),
  );
  const count = rows.filter((channel) => publishedIds.has(channel.salesChannelId)).length;
  const canToggle = sku.trim().length > 0;

  const toggle = (channelId: string, currentlyPublished: boolean) => {
    if (!canToggle) {
      return;
    }
    const next = currentlyPublished
      ? publicationLines.filter(
          (line) => !(line.sku === sku && line.salesChannelId === channelId),
        )
      : [...publicationLines, { sku, salesChannelId: channelId }];
    setValue("product.publicationLines", next, { shouldDirty: true, shouldTouch: true });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger(count)
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`${count} ${count === 1 ? "channel" : "channels"}`}
          >
            <Store /> {count}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sales channels</DialogTitle>
          <DialogDescription>Publish this variant to your channels.</DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-0">
          {rows.map((channel, index) => {
            const inputId = `channel-${sku || "none"}-${channel.salesChannelId}`;
            const published = publishedIds.has(channel.salesChannelId);
            const name = channel.name.trim() || salesChannelLabel(channel.type);
            return (
              <div key={channel.salesChannelId}>
                {index > 0 ? <FieldSeparator /> : null}
                <Field orientation="horizontal" className="py-3">
                  <FieldLabel htmlFor={inputId}>{name}</FieldLabel>
                  <Switch
                    id={inputId}
                    checked={published}
                    disabled={!canToggle}
                    onCheckedChange={() => toggle(channel.salesChannelId, published)}
                  />
                </Field>
              </div>
            );
          })}
        </FieldGroup>
      </DialogContent>
    </Dialog>
  );
}
