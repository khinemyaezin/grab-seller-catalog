import { useQuery } from "@tanstack/react-query";
import type { HateoasLink } from "@khinemyaezin/seller-api";
import { fetchSalesChannelRoot, salesChannelService, salesChannelsFromCollection } from "./sales-channel";
import type { SalesChannelResponse } from "@/features/products/types/sales-channel.response";

export function useSalesChannels(entryLink?: HateoasLink | null) {
  return useQuery<SalesChannelResponse[]>({
    queryKey: ["sales-channels", entryLink?.href],
    queryFn: async () => {
      const root = await fetchSalesChannelRoot(entryLink!);
      if (!root.listSalesChannels) {
        return [];
      }
      const collection = await salesChannelService.list(root.listSalesChannels);
      return salesChannelsFromCollection(collection);
    },
    enabled: !!entryLink,
    staleTime: 5 * 60 * 1000,
  });
}
