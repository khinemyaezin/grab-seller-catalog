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
import {
  channelPublishedOnAllSkus,
  togglePublicationChannelForSkus,
  unionChannelIds,
} from "@/features/products/lib/publication-lines";
import type { ProductFormValue, UpdateSellableProductPublicationLine } from "@/features/products/types";

export type VariantSalesChannelControlProps = {
  sku?: string;
  skus?: string[];
  disabled?: boolean;
  description?: string;
  trigger?: (count: number) => ReactNode;
};

function asPublicationLines(value: unknown): UpdateSellableProductPublicationLine[] {
  return Array.isArray(value) ? value : [];
}

function resolveSkus(sku: string | undefined, skus: string[] | undefined): string[] {
  if (skus) {
    return skus.map((value) => value.trim()).filter(Boolean);
  }
  const trimmed = sku?.trim() ?? "";
  return trimmed ? [trimmed] : [];
}

export function VariantSalesChannelControl({
  sku,
  skus,
  disabled = false,
  description,
  trigger,
}: VariantSalesChannelControlProps) {
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

  const targetSkus = resolveSkus(sku, skus);
  const publishedIds = new Set(unionChannelIds(publicationLines, targetSkus));
  const count = rows.filter((channel) => publishedIds.has(channel.salesChannelId)).length;
  const canToggle = !disabled && targetSkus.length > 0;
  const dialogDescription = description
    ?? (targetSkus.length > 1
      ? "Publish these variants to your channels."
      : "Publish this variant to your channels.");

  const toggle = (channelId: string, currentlyPublished: boolean) => {
    if (!canToggle) {
      return;
    }
    setValue(
      "product.publicationLines",
      togglePublicationChannelForSkus(publicationLines, targetSkus, channelId, currentlyPublished),
      { shouldDirty: true, shouldTouch: true },
    );
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
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-0">
          {rows.map((channel, index) => {
            const inputId = `channel-${targetSkus.join("-") || "none"}-${channel.salesChannelId}`;
            const published = channelPublishedOnAllSkus(
              publicationLines,
              targetSkus,
              channel.salesChannelId,
            );
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
