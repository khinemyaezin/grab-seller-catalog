import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProductUpdateWorkflow } from "./use-product-update-workflow";
import type { ProductFormValue } from "@/features/products/types";

const mockGetValues = vi.fn();
const mockValidate = vi.fn();
const mockMutateAsync = vi.fn();
const mockResetMutation = vi.fn();
const mockAwaitWorkflow = vi.fn();
const mockMergeContributions = vi.fn();
const mockCollectSlotFieldErrors = vi.fn();
const mockBuildUpdateSellableProductRequest = vi.fn();
const mockDetermineUpdateIntent = vi.fn();
const mockUseWorkflowAwaiter = vi.fn();
const mockUseCatalogLink = vi.fn();

vi.mock("react-hook-form", () => ({
  useFormContext: () => ({ getValues: mockGetValues }),
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
  useUpdateSellableProductMutation: () => ({
    mutateAsync: mockMutateAsync,
    reset: mockResetMutation,
  }),
}));

vi.mock("@/features/products/lib/update-sellable-product-request", () => ({
  buildUpdateSellableProductRequest: (...args: unknown[]) =>
    mockBuildUpdateSellableProductRequest(...args),
}));

vi.mock("@/features/products/lib/update-product-request", () => ({
  determineUpdateIntent: (...args: unknown[]) => mockDetermineUpdateIntent(...args),
}));

vi.mock("@/features/products/use-workflow-awaiter", () => ({
  useWorkflowAwaiter: (...args: unknown[]) => mockUseWorkflowAwaiter(...args),
  WorkflowTimeoutError: class WorkflowTimeoutError extends Error {},
}));

vi.mock("@/features/products/api/use-root", () => ({
  useCatalogLink: (...args: unknown[]) => mockUseCatalogLink(...args),
}));

const formValues: ProductFormValue = {
  product: {
    name: "Mug",
    category: { id: "cat-1", name: "Cat" },
    variants: [],
    standaloneVariant: { sku: "SKU-1", manageInventory: false },
  },
  variationTypes: [],
  medias: [],
  descriptions: [],
};

describe("useProductUpdateWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetValues.mockReturnValue(formValues);
    mockValidate.mockResolvedValue([{ valid: true }]);
    mockCollectSlotFieldErrors.mockReturnValue({});
    mockDetermineUpdateIntent.mockReturnValue("COLLAPSE_TO_STANDALONE");
    mockMergeContributions.mockReturnValue({ pricingLines: [], inventoryLines: [] });
    mockBuildUpdateSellableProductRequest.mockReturnValue({
      productId: "prod-1",
      product: { name: "Mug" },
    });
    mockUseWorkflowAwaiter.mockReturnValue({ awaitWorkflow: mockAwaitWorkflow });
    mockAwaitWorkflow.mockImplementation(async (trigger: (key: string) => Promise<unknown>) => {
      await trigger("idem-123");
    });
    mockUseCatalogLink.mockReturnValue({ href: "/workflows/update-sellable-product" });
    mockMutateAsync.mockResolvedValue({ workflowId: "wf-1", status: "COMPLETED" });
  });

  it("throws and emits validationFailed when slot validation fails", async () => {
    mockValidate.mockResolvedValue([{ valid: false, groupId: "g1", slotId: "s1" }]);
    mockCollectSlotFieldErrors.mockReturnValue({ "g1:s1": ["Required"] });
    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(() =>
      useProductUpdateWorkflow({
        productId: "prod-1",
        onLifecycleEvent,
      }),
    );

    await expect(result.current.submitWorkflow()).rejects.toThrow("Validation failed");
    expect(onLifecycleEvent).toHaveBeenCalledWith({
      type: "validationFailed",
      errors: { "g1:s1": ["Required"] },
    });
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("throws when update link is missing", async () => {
    mockUseCatalogLink.mockReturnValue(undefined);

    const { result } = renderHook(() =>
      useProductUpdateWorkflow({
        productId: "prod-1",
      }),
    );

    await expect(result.current.submitWorkflow()).rejects.toThrow("Missing update link");
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("builds payload, triggers mutation and resets mutation on success", async () => {
    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(() =>
      useProductUpdateWorkflow({
        productId: "prod-1",
        onLifecycleEvent,
      }),
    );

    const outcome = await result.current.submitWorkflow();

    expect(outcome).toEqual({ productId: "prod-1" });
    expect(mockDetermineUpdateIntent).toHaveBeenCalledWith({ hasVariationTypes: false });
    expect(mockBuildUpdateSellableProductRequest).toHaveBeenCalledWith(
      "prod-1",
      formValues,
      "COLLAPSE_TO_STANDALONE",
      { pricingLines: [], inventoryLines: [] },
    );
    expect(mockMutateAsync).toHaveBeenCalledWith({
      link: { href: "/workflows/update-sellable-product" },
      request: {
        productId: "prod-1",
        product: { name: "Mug" },
        idempotencyKey: "idem-123",
      },
    });
    expect(mockResetMutation).toHaveBeenCalled();
  });

  it("handles WorkflowTimeoutError and emits updateTimedOut", async () => {
    const { WorkflowTimeoutError } = await import("@/features/products/use-workflow-awaiter");
    mockAwaitWorkflow.mockRejectedValue(new WorkflowTimeoutError("Timeout"));
    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(() =>
      useProductUpdateWorkflow({
        productId: "prod-1",
        onLifecycleEvent,
      }),
    );

    await expect(result.current.submitWorkflow()).rejects.toThrow(WorkflowTimeoutError);
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "updateTimedOut" });
    expect(mockResetMutation).toHaveBeenCalled();
  });

  it("handles general error and emits updateFailed", async () => {
    mockAwaitWorkflow.mockRejectedValue(new Error("Server error"));
    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(() =>
      useProductUpdateWorkflow({
        productId: "prod-1",
        onLifecycleEvent,
      }),
    );

    await expect(result.current.submitWorkflow()).rejects.toThrow("Server error");
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "updateFailed" });
    expect(mockResetMutation).toHaveBeenCalled();
  });
});
