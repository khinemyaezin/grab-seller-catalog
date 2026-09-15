import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProductCreateSubmit } from "./use-product-create-submit";

const mockGetValues = vi.fn();
const mockValidate = vi.fn();
const mockMutateAsync = vi.fn();
const mockResetMutation = vi.fn();
const mockAwaitWorkflow = vi.fn();
const mockInvalidateProductQueries = vi.fn();
const mockQueryClient = {};
const mockMergeContributions = vi.fn();
const mockCollectSlotFieldErrors = vi.fn();
const mockBuildCreateSellableProductRequest = vi.fn();
const mockUseWorkflowAwaiter = vi.fn();
const mockResolveWorkflowProductId = vi.fn();
const mockStage = vi.fn();
const mockAttach = vi.fn();

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
  useCreateSellableProductMutation: () => ({
    mutateAsync: mockMutateAsync,
    reset: mockResetMutation,
  }),
  invalidateProductQueries: (...args: unknown[]) => mockInvalidateProductQueries(...args),
}));

vi.mock("@/features/products/adapters/create-sellable-product-request", () => ({
  buildCreateSellableProductRequest: (...args: unknown[]) =>
    mockBuildCreateSellableProductRequest(...args),
}));

vi.mock("@/features/products/hooks/use-workflow-awaiter", () => ({
  useWorkflowAwaiter: (...args: unknown[]) => mockUseWorkflowAwaiter(...args),
  WorkflowTimeoutError: class WorkflowTimeoutError extends Error {},
}));

vi.mock("@/features/products/api/workflow-product-id", () => ({
  resolveWorkflowProductId: (...args: unknown[]) => mockResolveWorkflowProductId(...args),
}));

vi.mock("@/features/products/hooks/use-product-media-sync", () => ({
  useProductMediaSync: () => ({ stage: mockStage, attach: mockAttach }),
}));

const formValues = {
  product: { name: "Mug", category: null, variants: [], standaloneVariant: { sku: "SKU-1" } },
  variationTypes: [],
  medias: [
    {
      id: "1",
      url: "blob:1",
      contentType: "image/jpeg",
      file: new File(["x"], "hero.jpg", { type: "image/jpeg" }),
      rank: 0,
    },
  ],
};

describe("useProductCreateSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetValues.mockReturnValue(formValues);
    mockCollectSlotFieldErrors.mockReturnValue({});
    mockMergeContributions.mockReturnValue({ pricingLines: [], inventoryLines: [] });
    mockBuildCreateSellableProductRequest.mockReturnValue({
      product: { name: "Mug" },
      variantTypes: [],
      pricingLines: [],
      inventoryLines: [],
    });
    mockUseWorkflowAwaiter.mockReturnValue({ awaitWorkflow: mockAwaitWorkflow });
    mockAwaitWorkflow.mockImplementation(async (trigger: (key: string) => Promise<unknown>) => {
      const response = await trigger("idem-1");
      return { response };
    });
    mockMutateAsync.mockResolvedValue({
      workflowId: "wf-1",
      status: "COMPLETED",
      productId: "prod-1",
    });
    mockResolveWorkflowProductId.mockResolvedValue("prod-1");
    mockStage.mockResolvedValue({ status: "synced" });
    mockAttach.mockResolvedValue({ status: "synced" });
    mockValidate.mockResolvedValue([{ valid: true, groupId: "g1", slotId: "s1" }]);
  });

  it("stages before create-sellable-product and does not put medias on the workflow request", async () => {
    const onLifecycleEvent = vi.fn();
    const onSuccess = vi.fn();
    const order: string[] = [];
    mockStage.mockImplementation(async () => {
      order.push("stage");
      return { status: "synced" };
    });
    mockMutateAsync.mockImplementation(async () => {
      order.push("create");
      return { workflowId: "wf-1", status: "COMPLETED", productId: "prod-1" };
    });
    mockAttach.mockImplementation(async (productId: string) => {
      order.push(`attach:${productId}`);
      return { status: "synced" };
    });
    const { result } = renderHook(() =>
      useProductCreateSubmit({
        link: { href: "/workflows/create-sellable-product" },
        onLifecycleEvent,
        onSuccess,
      }),
    );

    await result.current.submit();

    expect(order).toEqual(["stage", "create", "attach:prod-1"]);
    expect(mockBuildCreateSellableProductRequest).toHaveBeenCalledWith(
      formValues,
      { pricingLines: [], inventoryLines: [] },
    );
    expect(mockMutateAsync.mock.calls[0][0].request).not.toHaveProperty("medias");
    expect(mockAttach).toHaveBeenCalledWith("prod-1");
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "created" });
    expect(onSuccess).toHaveBeenCalledWith("prod-1");
    expect(mockInvalidateProductQueries).toHaveBeenCalledWith(mockQueryClient, "prod-1");
  });

  it("throws on stage failure and does not create a product", async () => {
    mockStage.mockResolvedValue({ status: "failed", error: new Error("Storage upload failed (403)") });
    const onLifecycleEvent = vi.fn();
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useProductCreateSubmit({
        link: { href: "/workflows/create-sellable-product" },
        onLifecycleEvent,
        onSuccess,
      }),
    );

    await expect(result.current.submit()).rejects.toThrow("Storage upload failed (403)");
    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(mockAttach).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onLifecycleEvent).not.toHaveBeenCalledWith({ type: "created" });
    expect(onLifecycleEvent).not.toHaveBeenCalledWith({ type: "createFailed" });
  });

  it("emits createMediaFailed and still succeeds Save when attach fails", async () => {
    mockAttach.mockResolvedValue({ status: "failed", error: new Error("Storage upload failed (403)") });
    const onLifecycleEvent = vi.fn();
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useProductCreateSubmit({
        link: { href: "/workflows/create-sellable-product" },
        onLifecycleEvent,
        onSuccess,
      }),
    );

    await result.current.submit();

    expect(mockMutateAsync).toHaveBeenCalled();
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "createMediaFailed" });
    expect(onLifecycleEvent).not.toHaveBeenCalledWith({ type: "created" });
    expect(onSuccess).toHaveBeenCalledWith("prod-1");
  });
});
