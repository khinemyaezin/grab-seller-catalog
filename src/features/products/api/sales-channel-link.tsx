import { createContext, useContext, type ReactNode } from "react";
import type { HateoasLink } from "@khinemyaezin/seller-api";

const SalesChannelLinkContext = createContext<HateoasLink | null>(null);

export function SalesChannelLinkProvider({
  link,
  children,
}: {
  link?: HateoasLink | null;
  children: ReactNode;
}) {
  return (
    <SalesChannelLinkContext.Provider value={link ?? null}>
      {children}
    </SalesChannelLinkContext.Provider>
  );
}

export function useSalesChannelLink() {
  return useContext(SalesChannelLinkContext);
}
