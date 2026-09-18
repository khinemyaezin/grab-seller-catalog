import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ProductPublicationPanel } from "./product-publication-panel";

const publishMutate = vi.fn();
const unpublishMutate = vi.fn();

vi.mock("@/features/products/api/sales-channel-link", () => ({
  useSalesChannelLink: () => ({ href: "/api/v1/sales-channels" }),
}));

vi.mock("@/features/products/api/use-root", () => ({
  useCatalogLink: () => undefined,
}));

vi.mock("@/features/products/api/use-sales-channels", () => ({
  useSalesChannels: () => ({
    data: [
      { salesChannelId: "web-1", name: "Website", type: "WEBSITE", status: "ENABLED" },
      { salesChannelId: "mkt-1", name: "Marketplace", type: "MARKETPLACE", status: "ENABLED" },
    ],
  }),
}));

vi.mock("@/features/products/api/use-products", () => ({
  usePublishProductToChannelMutation: () => ({
    mutateAsync: publishMutate,
    isPending: false,
  }),
  useUnpublishProductFromChannelMutation: () => ({
    mutateAsync: unpublishMutate,
    isPending: false,
  }),
}));

describe("ProductPublicationPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders website and marketplace toggles from channel list and publications", () => {
    render(
      <ProductPublicationPanel
        productId="prod-1"
        publications={[{ salesChannelId: "web-1" }]}
        links={{
          "publish-product-to-channel": { href: "/workflows/publish-product-to-channel" },
          "unpublish-product-from-channel": { href: "/catalog/products/prod-1/channels/unpublish" },
        }}
      />,
    );

    expect(screen.getByLabelText("Website")).toBeChecked();
    expect(screen.getByLabelText("Marketplace")).not.toBeChecked();
  });

  it("publishes through the workflow link and unpublishes through the catalog link", async () => {
    render(
      <ProductPublicationPanel
        productId="prod-1"
        publications={[{ salesChannelId: "web-1" }]}
        links={{
          "publish-product-to-channel": { href: "/workflows/publish-product-to-channel" },
          "unpublish-product-from-channel": { href: "/catalog/products/prod-1/channels/unpublish" },
        }}
      />,
    );

    fireEvent.click(screen.getByLabelText("Marketplace"));
    expect(publishMutate).toHaveBeenCalledWith({
      link: { href: "/workflows/publish-product-to-channel" },
      productId: "prod-1",
      salesChannelId: "mkt-1",
    });

    fireEvent.click(screen.getByLabelText("Website"));
    expect(unpublishMutate).toHaveBeenCalledWith({
      link: { href: "/catalog/products/prod-1/channels/unpublish" },
      productId: "prod-1",
      salesChannelId: "web-1",
    });
  });

  it("hides when channel publication links are missing", () => {
    render(
      <ProductPublicationPanel
        productId="prod-1"
        publications={[]}
        links={{}}
      />,
    );

    expect(screen.queryByText("Sales channels")).not.toBeInTheDocument();
  });
});
