import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import type { ReactNode } from "react";
import {
  useProductVariantEdit,
  transformVariantToFormValue,
  getVariantName,
  DEFAULT_PRODUCT_VARIANT_FORM_VALUE,
} from "./use-product-variant-edit";
import type { GetVariantResponse, ProductVariantForm } from "../types";

// Mock dependencies
const mockUseCatalogLink = vi.fn();
const mockUseProductVariantGet = vi.fn();

vi.mock("./use-root", () => ({
  useCatalogLink: (...args: unknown[]) => mockUseCatalogLink(...args),
}));

vi.mock("./use-products", () => ({
  useProductVariantGet: (...args: unknown[]) => mockUseProductVariantGet(...args),
}));

describe("transformVariantToFormValue & getVariantName", () => {
  it("formats variant name with multiple variations", () => {
    const apiData: GetVariantResponse = {
      productId: "prod-1",
      productName: "T-Shirt",
      variantId: "var-1",
      sku: "TSHIRT-RED-L",
      status: "ACTIVE",
      matrixKey: "red-l",
      variations: [
        { typeId: "t1", typeName: "Color", optionId: "o1", optionName: "Red" },
        { typeId: "t2", typeName: "Size", optionId: "o2", optionName: "Large" },
      ],
      manageInventory: true,
      _links: { self: { href: "/variants/var-1" } },
    };

    expect(getVariantName(apiData)).toBe("Red / Large");

    const formValue = transformVariantToFormValue(apiData);
    expect(formValue).toEqual({
      id: "var-1",
      name: "Red / Large",
      matrixKey: "red-l",
      sku: "TSHIRT-RED-L",
      manageInventory: true,
      variations: [
        { typeId: "t1", optionId: "o1" },
        { typeId: "t2", optionId: "o2" },
      ],
    });
  });

  it("falls back to productName if variations is empty", () => {
    const apiData: GetVariantResponse = {
      productId: "prod-2",
      productName: "Simple Mug",
      variantId: "var-2",
      sku: "MUG-1",
      status: "DRAFT",
      matrixKey: "",
      variations: [],
      manageInventory: false,
    };

    expect(getVariantName(apiData)).toBe("Simple Mug");

    const formValue = transformVariantToFormValue(apiData);
    expect(formValue).toEqual({
      id: "var-2",
      name: "Simple Mug",
      matrixKey: "",
      sku: "MUG-1",
      manageInventory: false,
      variations: [],
    });
  });
});

describe("useProductVariantEdit hook", () => {
  function createWrapper() {
    return function FormWrapper({ children }: { children: ReactNode }) {
      const methods = useForm<ProductVariantForm>({
        defaultValues: DEFAULT_PRODUCT_VARIANT_FORM_VALUE,
      });
      return <FormProvider {...methods}>{children}</FormProvider>;
    };
  }

  it("fetches variant data and resets form value", async () => {
    const mockRefetch = vi.fn();
    const mockVariantLink = { href: "/products/{productId}/variants/{variantId}", templated: true };
    mockUseCatalogLink.mockReturnValue(mockVariantLink);

    const mockApiResponse: GetVariantResponse = {
      productId: "prod-123",
      productName: "Sneakers",
      variantId: "var-456",
      sku: "SNK-BLK-42",
      status: "ACTIVE",
      matrixKey: "blk-42",
      variations: [
        { typeId: "t1", typeName: "Color", optionId: "o1", optionName: "Black" },
        { typeId: "t2", typeName: "Size", optionId: "o2", optionName: "42" },
      ],
      manageInventory: true,
      _links: { self: { href: "/variants/var-456" } },
    };

    mockUseProductVariantGet.mockReturnValue({
      data: mockApiResponse,
      isLoading: false,
      refetch: mockRefetch,
    });

    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(
      () =>
        useProductVariantEdit({
          productId: "prod-123",
          variantId: "var-456",
          onLifecycleEvent,
        }),
      { wrapper: createWrapper() }
    );

    expect(mockUseCatalogLink).toHaveBeenCalledWith("getVariant");
    expect(mockUseProductVariantGet).toHaveBeenCalledWith(mockVariantLink, {
      productId: "prod-123",
      variantId: "var-456",
    });

    await waitFor(() => {
      expect(onLifecycleEvent).toHaveBeenCalledWith({
        type: "titleResolved",
        title: "Black / 42",
      });
    });

    expect(result.current.status).toBe("ACTIVE");
    expect(result.current.actions).toEqual(mockApiResponse._links);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe(mockApiResponse);
  });
});
