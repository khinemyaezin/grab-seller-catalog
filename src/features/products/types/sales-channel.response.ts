import type { HateoasLink } from "@khinemyaezin/seller-api";

export type SalesChannelType = "WEBSITE" | "MARKETPLACE" | "POS";

export interface SalesChannelResponse {
  salesChannelId: string;
  name: string;
  type: SalesChannelType;
  owner: string;
  merchantId?: string | null;
  status: string;
  _links?: Record<string, HateoasLink>;
}

export interface SalesChannelsResponse {
  _embedded?: {
    salesChannelResponseList?: SalesChannelResponse[];
    salesChannelResponses?: SalesChannelResponse[];
  };
  _links?: Record<string, HateoasLink>;
}

export interface SalesChannelRoot {
  self?: HateoasLink;
  listSalesChannels?: HateoasLink;
  getSalesChannel?: HateoasLink;
}

export type ProductPublication = {
  salesChannelId: string;
};
