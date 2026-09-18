import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { ReactNode } from "react";
import { VariantSalesChannelControl } from "./variant-sales-channel-control";
import type { ProductFormValue } from "@/features/products/types";
import { DEFAULT_PRODUCT_FORM_VALUE } from "@/features/products/lib/product-form-defaults";

vi.mock("@/features/products/api/sales-channel-link", () => ({
  useSalesChannelLink: () => ({ href: "/api/v1/sales-channels" }),
}));

vi.mock("@/features/products/api/use-sales-channels", () => ({
  useSalesChannels: () => ({
    data: [
      { salesChannelId: "web-1", name: "Website", type: "WEBSITE", status: "ENABLED" },
      { salesChannelId: "mkt-1", name: "Marketplace", type: "MARKETPLACE", status: "ENABLED" },
    ],
  }),
}));

function Harness({
  seed,
  children,
}: {
  seed: ProductFormValue;
  children: ReactNode;
}) {
  const form = useForm<ProductFormValue>({ defaultValues: seed });
  const dirty = form.formState.isDirty;
  return (
    <FormProvider {...form}>
      {children}
      <span data-testid="dirty">{String(dirty)}</span>
      <span data-testid="lines">{JSON.stringify(form.watch("product.publicationLines"))}</span>
    </FormProvider>
  );
}

describe("VariantSalesChannelControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const seed: ProductFormValue = {
    ...DEFAULT_PRODUCT_FORM_VALUE,
    product: {
      ...DEFAULT_PRODUCT_FORM_VALUE.product,
      variants: [
        {
          id: "var-1",
          name: "Red",
          matrixKey: "red",
          sku: "SKU-1",
          variations: [{ typeId: "t1", optionId: "o1" }],
        },
      ],
      publicationLines: [{ sku: "SKU-1", salesChannelId: "web-1" }],
    },
  };

  it("shows the published channel count from form state", () => {
    render(
      <Harness seed={seed}>
        <VariantSalesChannelControl sku="SKU-1" />
      </Harness>,
    );

    expect(screen.getByRole("button", { name: "1 channel" })).toBeInTheDocument();
  });

  it("toggles a channel in product.publicationLines without calling APIs", () => {
    render(
      <Harness seed={seed}>
        <VariantSalesChannelControl sku="SKU-1" />
      </Harness>,
    );

    fireEvent.click(screen.getByRole("button", { name: "1 channel" }));

    expect(screen.getByRole("switch", { name: "Website" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Marketplace" })).not.toBeChecked();

    fireEvent.click(screen.getByRole("switch", { name: "Marketplace" }));

    expect(screen.getByRole("switch", { name: "Website" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Marketplace" })).toBeChecked();
    expect(screen.getByTestId("dirty")).toHaveTextContent("true");
    expect(JSON.parse(screen.getByTestId("lines").textContent ?? "[]")).toEqual([
      { sku: "SKU-1", salesChannelId: "web-1" },
      { sku: "SKU-1", salesChannelId: "mkt-1" },
    ]);
  });

  it("renders custom trigger via callback receiving count", () => {
    render(
      <Harness seed={seed}>
        <VariantSalesChannelControl
          sku="SKU-1"
          trigger={(count) => (
            <button type="button" data-testid="custom-trigger">
              Channels: {count}
            </button>
          )}
        />
      </Harness>,
    );

    expect(screen.getByTestId("custom-trigger")).toHaveTextContent("Channels: 1");
  });
});
