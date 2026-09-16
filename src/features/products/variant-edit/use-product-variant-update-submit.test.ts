import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProductVariantUpdateSubmit } from "./use-product-variant-update-submit";

const mockGetValues = vi.fn();
const mockValidate = vi.fn();
const mockExecute = vi.fn();
const mockResetCommand = vi.fn();
const mockInvalidateProductQueries = vi.fn();
const mockQueryClient = {};
const mockMergeContributions = vi.fn();
const mockCollectSlotFieldErrors = vi.fn();
const mockBuildUpdateProductVariantRequest = vi.fn();
const mockLink: { current: { href: string } | undefined } = {
  current: { href: "/update-product-variant" },
};

vi.mock("react-hook-form", () => ({
  useFormContext: () => ({ getValues: mockGetValues }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockQueryClient,
}));

vi.mock("@khinemyaezin/seller-ui", () => ({
  collectSlotFieldErrors: (...args: unknown[]) => mockCollectSlotFieldErrors(...args),
  mergeContributions: (...args: unknown[]) => mockMergeContributions(...args),
  useValidateAllSlots: () => ({ validate: mockValidate }),
}));

vi.mock("@khinemyaezin/seller-contracts", () => ({
  PRODUCT_CONTRIBUTION_SLICES: {
    PRICING_LINES: "pricingLines",
    INVENTORY_LINES: "inventoryLines",
  },
}));

vi.mock("@/features/products/api/use-products", () => ({
  invalidateProductQueries: (...args: unknown[]) => mockInvalidateProductQueries(...args),
}));

vi.mock("@/features/products/lib/update-product-variant-request", () => ({
  buildUpdateProductVariantRequest: (...args: unknown[]) =>
    mockBuildUpdateProductVariantRequest(...args),
}));

vi.mock("./use-product-variant-update-command", () => ({
  useUpdateProductVariantCommand: () => ({
    execute: mockExecute,
    reset: mockResetCommand,
    isPending: false,
    link: mockLink.current,
  }),
}));

vi.mock("@/features/products/use-workflow-awaiter", () => ({
  WorkflowTimeoutError: class WorkflowTimeoutError extends Error {},
}));

const variantValues = {
  id: "var-1",
  name: "Red",
  matrixKey: "red",
  sku: "SKU-1",
  manageInventory: true,
  variations: [{ typeId: "t1", optionId: "o1" }],
};

describe("useProductVariantUpdateSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLink.current = { href: "/update-product-variant" };
    mockGetValues.mockReturnValue(variantValues);
    mockCollectSlotFieldErrors.mockReturnValue({});
    mockMergeContributions.mockReturnValue({ pricingLines: [], inventoryLines: [] });
    mockBuildUpdateProductVariantRequest.mockReturnValue({
      productId: "prod-1",
      variantId: "var-1",
      sku: "SKU-1",
    });
    mockExecute.mockResolvedValue(undefined);
    mockValidate.mockResolvedValue([{ valid: true, groupId: "g1", slotId: "s1" }]);
  });

  it("throws when the update link is missing", async () => {
    mockLink.current = undefined;
    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(() =>
      useProductVariantUpdateSubmit({
        productId: "prod-1",
        variantId: "var-1",
        onLifecycleEvent,
      }),
    );

    await expect(result.current.submit()).rejects.toThrow("Missing update link");
    expect(mockValidate).not.toHaveBeenCalled();
    expect(onLifecycleEvent).not.toHaveBeenCalled();
  });

  it("emits validationFailed and throws when a slot is invalid", async () => {
    mockValidate.mockResolvedValue([{ valid: false, groupId: "g1", slotId: "s1" }]);
    mockCollectSlotFieldErrors.mockReturnValue({ "g1::s1": { amount: "Required" } });
    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(() =>
      useProductVariantUpdateSubmit({
        productId: "prod-1",
        variantId: "var-1",
        onLifecycleEvent,
      }),
    );

    await expect(result.current.submit()).rejects.toThrow("Validation failed");
    expect(onLifecycleEvent).toHaveBeenCalledWith({
      type: "validationFailed",
      errors: { "g1::s1": { amount: "Required" } },
    });
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("posts, invalidates, and emits updated on success", async () => {
    const contributions = {
      pricingLines: [{ sku: "SKU-1", currencyCode: "USD", amount: 10 }],
      inventoryLines: [],
    };
    mockMergeContributions.mockReturnValue(contributions);
    const payload = {
      productId: "prod-1",
      variantId: "var-1",
      sku: "SKU-1",
      price: { currencyCode: "USD", amount: 10 },
    };
    mockBuildUpdateProductVariantRequest.mockReturnValue(payload);
    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(() =>
      useProductVariantUpdateSubmit({
        productId: "prod-1",
        variantId: "var-1",
        onLifecycleEvent,
      }),
    );

    await result.current.submit();

    expect(mockBuildUpdateProductVariantRequest).toHaveBeenCalledWith(
      "prod-1",
      "var-1",
      variantValues,
      contributions,
    );
    expect(mockExecute).toHaveBeenCalledWith(payload);
    expect(mockInvalidateProductQueries).toHaveBeenCalledWith(mockQueryClient, "prod-1");
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "updated" });
    expect(mockResetCommand).toHaveBeenCalled();
  });
});
