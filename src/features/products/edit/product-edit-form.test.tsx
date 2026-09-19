import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ProductEditForm from "./product-edit-form";
import { DEFAULT_PRODUCT_FORM_VALUE } from "@/features/products/lib/product-form-defaults";
import type { ProductFormValue } from "@/features/products/types";

vi.mock("./use-product-update-submit", () => ({
  useProductUpdateSubmit: () => ({ submit: vi.fn() }),
}));

vi.mock("@/features/products/use-matrix-sync", () => ({
  useMatrixSync: () => ({ isGenerating: false }),
}));

vi.mock("@/features/products/ui/slots/pricing/pricing-edit-standalone", () => ({
  PricingEditStandalone: () => null,
}));

vi.mock("@/features/products/ui/slots/inventory/inventory-edit-standalone", () => ({
  InventoryEditStandalone: () => null,
}));

vi.mock("@/features/products/ui/product-basic-fieldset", () => ({
  default: () => <div>basic</div>,
}));

vi.mock("@/features/products/ui/product-media-fieldset", () => ({
  default: () => <div>media</div>,
}));

vi.mock("./product-edit-variation", () => ({
  default: () => <div>variation</div>,
}));

vi.mock("@/features/products/ui/sales-channel", () => ({
  SalesChannel: () => <div>sales-channel-rail</div>,
}));

vi.mock("@/features/products/use-product-name-watch", () => ({
  default: () => undefined,
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

const activeSeed: ProductFormValue = {
  ...DEFAULT_PRODUCT_FORM_VALUE,
  product: {
    ...DEFAULT_PRODUCT_FORM_VALUE.product,
    name: "Mug",
    status: "ACTIVE",
  },
};

describe("ProductEditForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the status select with the seeded product status", () => {
    render(
      <ProductEditForm
        productId="prod-1"
        seed={activeSeed}
      />,
    );

    const status = screen.getByLabelText("Status");
    expect(status.closest("aside")).not.toBeNull();
    expect(status).toHaveTextContent("Active"); expect(screen.getByText("sales-channel-rail")).toBeInTheDocument();
  });
});
