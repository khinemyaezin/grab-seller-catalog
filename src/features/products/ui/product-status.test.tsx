import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { ReactNode } from "react";
import { ProductStatus } from "./product-status";
import type { ProductFormValue } from "@/features/products/types";
import { DEFAULT_PRODUCT_FORM_VALUE } from "@/features/products/lib/product-form-defaults";

function Harness({
  seed = DEFAULT_PRODUCT_FORM_VALUE,
  children,
}: {
  seed?: ProductFormValue;
  children: ReactNode;
}) {
  const form = useForm<ProductFormValue>({ defaultValues: seed });
  return <FormProvider {...form}>{children}</FormProvider>;
}

function openStatusPicker() {
  fireEvent.click(screen.getByRole("combobox", { name: "Status" }));
}

describe("ProductStatus", () => {
  afterEach(() => {
    cleanup();
  });

  it("defaults to Draft", () => {
    render(
      <Harness>
        <ProductStatus />
      </Harness>,
    );

    expect(screen.getByRole("combobox", { name: "Status" })).toHaveTextContent("Draft");
    openStatusPicker();
    expect(screen.getByRole("option", { name: /Draft/ })).not.toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("option", { name: /Active/ })).not.toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("option", { name: /Draft/ })).toHaveTextContent(
      "Not visible on selected sales channels or markets",
    );
    expect(screen.getByRole("option", { name: /Active/ })).toHaveTextContent(
      "Sell via selected sales channels and markets",
    );
  });

  it("shows the seeded Active status and disables Draft", () => {
    render(
      <Harness
        seed={{
          ...DEFAULT_PRODUCT_FORM_VALUE,
          product: { ...DEFAULT_PRODUCT_FORM_VALUE.product, status: "ACTIVE" },
        }}
      >
        <ProductStatus />
      </Harness>,
    );

    expect(screen.getByRole("combobox", { name: "Status" })).toHaveTextContent("Active");
    openStatusPicker();
    expect(screen.getByRole("option", { name: /Draft/ })).toHaveAttribute("aria-disabled", "true");
  });

  it("shows archived status as read-only", () => {
    render(
      <Harness
        seed={{
          ...DEFAULT_PRODUCT_FORM_VALUE,
          product: { ...DEFAULT_PRODUCT_FORM_VALUE.product, status: "ARCHIVED" },
        }}
      >
        <ProductStatus />
      </Harness>,
    );

    const trigger = screen.getByRole("combobox", { name: "Status" });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveTextContent("Archived");
  });
});
