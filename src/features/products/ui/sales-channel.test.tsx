import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { ReactNode } from "react";
import { SalesChannel } from "./sales-channel";
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
  return (
    <FormProvider {...form}>
      {children}
      <span data-testid="lines">{JSON.stringify(form.watch("product.publicationLines"))}</span>
    </FormProvider>
  );
}

describe("SalesChannel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("lists only channels published for the standalone sku", () => {
    const seed: ProductFormValue = {
      ...DEFAULT_PRODUCT_FORM_VALUE,
      product: {
        ...DEFAULT_PRODUCT_FORM_VALUE.product,
        status: "ACTIVE",
        standaloneVariant: { sku: "MUG-1", id: "var-1" },
        publicationLines: [{ sku: "MUG-1", salesChannelId: "web-1" }],
      },
    };

    render(
      <Harness seed={seed}>
        <SalesChannel />
      </Harness>,
    );

    expect(screen.getByText("Website")).toBeInTheDocument();
    expect(screen.queryByText("Marketplace")).not.toBeInTheDocument();
    expect(screen.getByText("Publish this listing to your channels.")).toBeInTheDocument();
  });

  it("does not list every channel when the standalone sku has no publications", () => {
    const seed: ProductFormValue = {
      ...DEFAULT_PRODUCT_FORM_VALUE,
      product: {
        ...DEFAULT_PRODUCT_FORM_VALUE.product,
        status: "ACTIVE",
        standaloneVariant: { sku: "MUG-1" },
        publicationLines: [],
      },
    };

    render(
      <Harness seed={seed}>
        <SalesChannel />
      </Harness>,
    );

    expect(screen.getByText("Not published to any sales channels.")).toBeInTheDocument();
    expect(screen.queryByText("Website")).not.toBeInTheDocument();
  });

  it("disables manage when the standalone sku is empty", () => {
    render(
      <Harness seed={DEFAULT_PRODUCT_FORM_VALUE}>
        <SalesChannel />
      </Harness>,
    );

    expect(screen.getByRole("button", { name: "Manage sales channels, 0 selected" })).toBeDisabled();
  });

  it("writes publication lines for the standalone sku", () => {
    const seed: ProductFormValue = {
      ...DEFAULT_PRODUCT_FORM_VALUE,
      product: {
        ...DEFAULT_PRODUCT_FORM_VALUE.product,
        status: "ACTIVE",
        standaloneVariant: { sku: "MUG-1", id: "var-1" },
        publicationLines: [],
      },
    };

    render(
      <Harness seed={seed}>
        <SalesChannel />
      </Harness>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Manage sales channels, 0 selected" }));
    fireEvent.click(screen.getByRole("switch", { name: "Website" }));

    expect(JSON.parse(screen.getByTestId("lines").textContent ?? "[]")).toEqual([
      { sku: "MUG-1", salesChannelId: "web-1" },
    ]);
  });

  it("applies rail manage to every matrix sku", () => {
    const seed: ProductFormValue = {
      ...DEFAULT_PRODUCT_FORM_VALUE,
      variationTypes: [{ uuid: "t1", name: "Color", options: [{ uuid: "o1", name: "Red" }] }],
      product: {
        ...DEFAULT_PRODUCT_FORM_VALUE.product,
        status: "ACTIVE",
        variants: [
          {
            id: "var-1",
            name: "Red",
            matrixKey: "red",
            sku: "SKU-RED",
            variations: [{ typeId: "t1", optionId: "o1" }],
          },
          {
            id: "var-2",
            name: "Blue",
            matrixKey: "blue",
            sku: "SKU-BLUE",
            variations: [{ typeId: "t1", optionId: "o2" }],
          },
        ],
        publicationLines: [],
      },
    };

    render(
      <Harness seed={seed}>
        <SalesChannel />
      </Harness>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Manage sales channels, 0 selected" }));
    fireEvent.click(screen.getByRole("switch", { name: "Website" }));

    expect(JSON.parse(screen.getByTestId("lines").textContent ?? "[]")).toEqual([
      { sku: "SKU-RED", salesChannelId: "web-1" },
      { sku: "SKU-BLUE", salesChannelId: "web-1" },
    ]);
  });
});
