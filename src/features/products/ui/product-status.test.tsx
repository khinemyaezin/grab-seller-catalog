import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
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

    const select = screen.getByLabelText("Status");
    expect(select).toHaveValue("DRAFT");
    expect(screen.getByRole("option", { name: "Draft" })).toBeEnabled();
    expect(screen.getByRole("option", { name: "Active" })).toBeEnabled();
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

    expect(screen.getByLabelText("Status")).toHaveValue("ACTIVE");
    expect(screen.getByRole("option", { name: "Draft" })).toBeDisabled();
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

    expect(screen.getByLabelText("Status")).toBeDisabled();
    expect(screen.getByLabelText("Status")).toHaveValue("ARCHIVED");
    expect(screen.getByRole("option", { name: "Archived" })).toBeInTheDocument();
  });
});
