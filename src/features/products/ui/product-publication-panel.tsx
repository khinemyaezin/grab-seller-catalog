import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@khinemyaezin/seller-ui/components/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@khinemyaezin/seller-ui/components/field";
import { Toggle } from "@khinemyaezin/seller-ui/components/toggle";
import { cn } from "@khinemyaezin/seller-ui";
import { resolveLink, type HateoasLink } from "@khinemyaezin/seller-api";
import { useCatalogLink } from "@/features/products/api/use-root";
import { useSalesChannelLink } from "@/features/products/api/sales-channel-link";
import { useSalesChannels } from "@/features/products/api/use-sales-channels";
import {
  usePublishProductToChannelMutation,
  useUnpublishProductFromChannelMutation,
} from "@/features/products/api/use-products";
import { isSellerFacingChannel, salesChannelLabel } from "@/features/products/lib/sales-channel-label";
import type { ProductPublication } from "@/features/products/types";

export type ProductPublicationPanelProps = {
  productId: string;
  publications?: ProductPublication[];
  links?: Record<string, HateoasLink>;
};

export function ProductPublicationPanel({
  productId,
  publications = [],
  links,
}: ProductPublicationPanelProps) {
  const salesChannelLink = useSalesChannelLink();
  const catalogPublishLink = useCatalogLink("publishProductToChannel");
  const { data: channels = [] } = useSalesChannels(salesChannelLink);
  const publishMutation = usePublishProductToChannelMutation();
  const unpublishMutation = useUnpublishProductFromChannelMutation();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  const publishLink = resolveLink(links, "publish-product-to-channel") ?? catalogPublishLink;
  const unpublishLink = resolveLink(links, "unpublish-product-from-channel");

  if (!salesChannelLink || (!publishLink && !unpublishLink)) {
    return null;
  }

  const publishedIds = new Set(publications.map((publication) => publication.salesChannelId));

  const rows = channels
    .filter((channel) => isSellerFacingChannel(channel.type))
    .map((channel) => {
      const published = publishedIds.has(channel.salesChannelId);
      const canToggle = published ? !!unpublishLink : !!publishLink;
      return {
        channel,
        published,
        canToggle,
      };
    });

  if (rows.length === 0) {
    return null;
  }

  const toggle = async (channelId: string, currentlyPublished: boolean) => {
    setActiveChannelId(channelId);
    try {
      if (currentlyPublished) {
        if (!unpublishLink) return;
        await unpublishMutation.mutateAsync({
          link: unpublishLink,
          productId,
          salesChannelId: channelId,
        });
        return;
      }
      if (!publishLink) return;
      await publishMutation.mutateAsync({
        link: publishLink,
        productId,
        salesChannelId: channelId,
      });
    } finally {
      setActiveChannelId(null);
    }
  };

  return (
    <Card>
      <CardContent>
        <FieldSet>
          <FieldLegend>Sales channels</FieldLegend>
          <FieldDescription>Publish this product to your channels.</FieldDescription>
          <FieldGroup className="gap-3">
            {rows.map((row) => {
              const inputId = `channel-${row.channel.salesChannelId}`;
              const isMutating = activeChannelId === row.channel.salesChannelId;
              const disabled = isMutating || !row.canToggle;

              return (
                <Field
                  key={row.channel.salesChannelId}
                  className="flex items-center justify-between gap-4 py-1"
                >
                  <FieldLabel
                    htmlFor={inputId}
                    className="text-sm font-medium text-foreground cursor-pointer select-none"
                  >
                    {salesChannelLabel(row.channel.type)}
                  </FieldLabel>

                  <Toggle
                    id={inputId}
                    variant="outline"
                    size="sm"
                    pressed={row.published}
                    role="checkbox"
                    aria-checked={row.published}
                    disabled={disabled}
                    onPressedChange={() => {
                      void toggle(row.channel.salesChannelId, row.published);
                    }}
                    className={cn(
                      "h-8 px-3 rounded-lg text-sm font-medium gap-1.5 cursor-pointer select-none transition-all",
                      row.published
                        ? "data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground data-[state=on]:border-border hover:bg-secondary/80 shadow-xs"
                        : "data-[state=off]:bg-muted/40 data-[state=off]:text-muted-foreground data-[state=off]:border-border/70 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {isMutating ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : row.published ? (
                      <Check className="size-4 text-foreground stroke-[2.5]" />
                    ) : null}
                    <span>{row.published ? "Published" : "Publishable"}</span>
                  </Toggle>
                </Field>
              );
            })}
          </FieldGroup>
        </FieldSet>
      </CardContent>
    </Card>
  );
}

