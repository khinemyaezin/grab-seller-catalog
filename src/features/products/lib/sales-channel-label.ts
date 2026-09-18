import type { SalesChannelType } from "@/features/products/types/sales-channel.response";

export function salesChannelLabel(type: string): string {
  switch (type as SalesChannelType) {
    case "WEBSITE":
      return "Website";
    case "MARKETPLACE":
      return "Marketplace";
    case "POS":
      return "POS";
    default:
      return type;
  }
}

export function isSellerFacingChannel(type: string): boolean {
  return type === "WEBSITE" || type === "MARKETPLACE";
}
