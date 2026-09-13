import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProductVariantUpdateSubmit } from "./use-product-variant-update-submit";

const mockGetValues = vi.fn();
const mockUseCatalogLink = vi.fn();
const mockValidate = vi.fn();
const mockMutateAsync = vi.fn();
const mockResetMutation = vi.fn();
const mockAwaitWorkflow = vi.fn();
const mockInvalidateProductQueries = vi.fn();
const mockQueryClient = {};
const mockMergeContributions = vi.fn();
const mockCollectSlotFieldErrors = vi.fn();
const mockBuildUpdateProductVariantRequest = vi.fn();
const mockUseWorkflowAwaiter = vi.fn();

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

vi.mock("@/features/products/hooks/use-products", () => ({
  useUpdateProductVariantMutation: () => ({
    mutateAsync: mockMutateAsync,
    reset: mockResetMutation,
  }),
  invalidateProductQueries: (...args: unknown[]) => mockInvalidateProductQueries(...args),
}));

vi.mock("@/features/products/adapters/update-product-variant-request", () => ({
  buildUpdateProductVariantRequest: (...args: unknown[]) =>
    mockBuildUpdateProductVariantRequest(...args),
}));

vi.mock("@/features/products/hooks/use-workflow-awaiter", () => ({
  useWorkflowAwaiter: (...args: unknown[]) => mockUseWorkflowAwaiter(...args),
  WorkflowTimeoutError: class WorkflowTimeoutError extends Error {},
}));

vi.mock("./use-root", () => ({
  useCatalogLink: (...args: unknown[]) => mockUseCatalogLink(...args),
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
    mockGetValues.mockReturnValue(variantValues);
    mockCollectSlotFieldErrors.mockReturnValue({});
    mockMergeContributions.mockReturnValue({ pricingLines: [], inventoryLines: [] });
    mockBuildUpdateProductVariantRequest.mockReturnValue({
      productId: "prod-1",
      variantId: "var-1",
      sku: "SKU-1",
    });
    mockUseWorkflowAwaiter.mockReturnValue({ awaitWorkflow: mockAwaitWorkflow });
  });

  it("throws when the update link is missing", async () => {
    mockUseCatalogLink.mockReturnValue(undefined);
    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(() =>
      useProductVariantUpdateSubmit({
        productId: "prod-1",
        variantId: "var-1",
        onLifecycleEvent,
      }),
    );

    expect(mockUseCatalogLink).toHaveBeenCalledWith("updateProductVariant");
    expect(mockUseWorkflowAwaiter).toHaveBeenCalledWith({
      workflowName: "update-product-variant",
    });
    await expect(result.current.submit()).rejects.toThrow("Missing update link");
    expect(mockValidate).not.toHaveBeenCalled();
    expect(onLifecycleEvent).not.toHaveBeenCalled();
  });

  it("emits validationFailed and throws when a slot is invalid", async () => {
    mockUseCatalogLink.mockReturnValue({ href: "/update-product-variant" });
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
    expect(mockAwaitWorkflow).not.toHaveBeenCalled();
  });

  it("posts, invalidates, and emits updated on success", async () => {
    const updateLink = { href: "/api/v1/workflows/update-product-variant" };
    mockUseCatalogLink.mockReturnValue(updateLink);
    mockValidate.mockResolvedValue([{ valid: true, groupId: "g1", slotId: "s1" }]);
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
    mockAwaitWorkflow.mockImplementation(async (trigger: (key: string) => Promise<unknown>) => {
      await trigger("idem-1");
    });
    mockMutateAsync.mockResolvedValue({ workflowId: "wf-1", status: "COMPLETED" });
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
    expect(mockMutateAsync).toHaveBeenCalledWith({
      link: updateLink,
      request: { ...payload, idempotencyKey: "idem-1" },
    });
    expect(mockInvalidateProductQueries).toHaveBeenCalledWith(mockQueryClient, "prod-1");
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "updated" });
    expect(mockResetMutation).toHaveBeenCalled();
  });
});
