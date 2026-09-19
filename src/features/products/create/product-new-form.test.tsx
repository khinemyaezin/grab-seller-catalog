import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ProductNewForm from "./product-new-form";

vi.mock("./use-product-create-submit", () => ({
  useProductCreateSubmit: () => ({ submit: vi.fn() }),
}));

vi.mock("@/features/products/use-matrix-sync", () => ({
  useMatrixSync: () => ({ isGenerating: false }),
}));

vi.mock("@/features/products/ui/slots/pricing/pricing-standalone", () => ({
  PricingStandalone: () => null,
}));

vi.mock("@/features/products/ui/slots/inventory/inventory-standalone", () => ({
  InventoryStandalone: () => null,
}));

vi.mock("@/features/products/ui/product-basic-fieldset", () => ({
  default: () => <div>basic</div>,
}));

vi.mock("@/features/products/ui/product-media-fieldset", () => ({
  default: () => <div>media</div>,
}));

vi.mock("./product-new-variation", () => ({
  default: () => <div>variation</div>,
}));

vi.mock("@/features/products/ui/sales-channel", () => ({
  SalesChannel: () => <div>sales-channel-rail</div>,
}));

vi.mock("@khinemyaezin/seller-ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@khinemyaezin/seller-ui")>();
  return {
    ...actual,
    useContextBar: () => undefined,
    useResetAllSlots: () => vi.fn(),
    useIsExtensionDirty: () => [false, vi.fn()],
  };
});

describe("ProductNewForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the sales channel rail beside the main column", () => {
    render(
      <ProductNewForm
        link={{ href: "/workflows/create-sellable-product" }}
      />,
    );

    const rail = screen.getByText("sales-channel-rail").closest("aside");
    expect(rail).not.toBeNull();
    expect(screen.getByText("basic")).toBeInTheDocument();
  });

  it("renders the status select as Draft in the aside", () => {
    render(
      <ProductNewForm
        link={{ href: "/workflows/create-sellable-product" }}
      />,
    );

    const status = screen.getByLabelText("Status");
    expect(status.closest("aside")).not.toBeNull();
    expect(status).toHaveValue("DRAFT");
  });
});
