import { Button } from "@khinemyaezin/seller-ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@khinemyaezin/seller-ui/components/card";
import { useFormContext, useWatch } from "react-hook-form";
import { useSalesChannelLink } from "@/features/products/api/sales-channel-link";
import { useSalesChannels } from "@/features/products/api/use-sales-channels";
import { isStandaloneProductForm } from "@/features/products/lib/is-standalone-product-form";
import { publicationTargetSkus, unionChannelIds } from "@/features/products/lib/publication-lines";
import { isSellerFacingChannel, salesChannelLabel } from "@/features/products/lib/sales-channel-label";
import { VariantSalesChannelControl } from "@/features/products/ui/variant-sales-channel-control";
import type { ProductFormValue } from "@/features/products/types";
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription } from "@khinemyaezin/seller-ui/components/item";
import { InboxIcon, Settings2 } from "lucide-react";

export function SalesChannel() {
  const { control } = useFormContext<ProductFormValue>();
  const variationTypes = useWatch({ control, name: "variationTypes" });
  const standaloneSku = useWatch({ control, name: "product.standaloneVariant.sku" });
  const variants = useWatch({ control, name: "product.variants" });
  const publicationLines = useWatch({ control, name: "product.publicationLines" });
  const status = useWatch({ control, name: "product.status" });

  const salesChannelLink = useSalesChannelLink();
  const { data: channels = [] } = useSalesChannels(salesChannelLink);
  const rows = channels.filter((channel) => isSellerFacingChannel(channel.type));

  if (rows.length === 0) {
    return null;
  }

  const isStandalone = isStandaloneProductForm(variationTypes);
  const targetSkus = publicationTargetSkus({
    variationTypes,
    product: {
      standaloneVariant: { sku: standaloneSku },
      variants,
    },
  });
  const selectedIds = new Set(unionChannelIds(publicationLines, targetSkus));
  const selected = rows.filter((channel) => selectedIds.has(channel.salesChannelId));
  const canManage = status === "ACTIVE";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales channels</CardTitle>
        <CardAction>
          <VariantSalesChannelControl
            skus={targetSkus}
            disabled={!canManage}
            description={
              isStandalone
                ? "Publish this listing to your channels."
                : "Apply these channels to every variant. You can still change a single row."
            }
            trigger={(count) => (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={!canManage || targetSkus.length === 0}
                aria-label={`Manage sales channels, ${count} selected`}
              >
                <Settings2 />
              </Button>
            )}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        {selected.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Not published to any sales channels.
          </p>
        ) : (
          <div className="grid gap-2">
            {selected.map((channel) => {
              const name = channel.name.trim() || salesChannelLabel(channel.type);
              return (
                <Item key={channel.salesChannelId} variant="muted" size="xs">
                  <ItemContent>
                    <ItemTitle>{name}</ItemTitle>
                  </ItemContent>
                </Item>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
