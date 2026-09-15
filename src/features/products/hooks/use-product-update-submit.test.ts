import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProductUpdateSubmit } from "./use-product-update-submit";
import type { ProductFormValue } from "@/features/products/types";

const mockGetValues = vi.fn();
const mockDirtyFields: { current: Record<string, unknown> } = { current: {} };
const mockValidate = vi.fn();
const mockMutateAsync = vi.fn();
const mockResetMutation = vi.fn();
const mockAwaitWorkflow = vi.fn();
const mockInvalidateProductQueries = vi.fn();
const mockQueryClient = {};
const mockMergeContributions = vi.fn();
const mockCollectSlotFieldErrors = vi.fn();
const mockBuildUpdateSellableProductRequest = vi.fn();
const mockUseWorkflowAwaiter = vi.fn();
const mockUseCatalogLink = vi.fn();
const mockStage = vi.fn();
const mockAttach = vi.fn();
const mockIsCatalogFormDirty = vi.fn();
const mockExtensionDirty = false;

vi.mock("react-hook-form", () => ({
  useFormContext: () => ({
    getValues: mockGetValues,
    formState: { dirtyFields: mockDirtyFields.current },
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockQueryClient,
}));

vi.mock("@khinemyaezin/seller-ui", () => ({
  collectSlotFieldErrors: (...args: unknown[]) => mockCollectSlotFieldErrors(...args),
  mergeContributions: (...args: unknown[]) => mockMergeContributions(...args),
  useValidateAllSlots: () => ({ validate: mockValidate }),
  useIsExtensionDirty: () => [mockExtensionDirty, vi.fn()],
}));

vi.mock("@khinemyaezin/seller-contracts", () => ({
  PRODUCT_CONTRIBUTION_SLICES: {
    PRICING_LINES: "pricingLines",
    INVENTORY_LINES: "inventoryLines",
  },
}));

vi.mock("@/features/products/hooks/use-products", () => ({
  useUpdateSellableProductMutation: () => ({
    mutateAsync: mockMutateAsync,
    reset: mockResetMutation,
  }),
  invalidateProductQueries: (...args: unknown[]) => mockInvalidateProductQueries(...args),
}));

vi.mock("@/features/products/adapters/update-sellable-product-request", () => ({
  buildUpdateSellableProductRequest: (...args: unknown[]) =>
    mockBuildUpdateSellableProductRequest(...args),
}));

vi.mock("@/features/products/adapters/update-product-request", () => ({
  determineUpdateIntent: () => "COLLAPSE_TO_STANDALONE",
}));

vi.mock("@/features/products/hooks/use-workflow-awaiter", () => ({
  useWorkflowAwaiter: (...args: unknown[]) => mockUseWorkflowAwaiter(...args),
  WorkflowTimeoutError: class WorkflowTimeoutError extends Error {},
}));

vi.mock("./use-root", () => ({
  useCatalogLink: (...args: unknown[]) => mockUseCatalogLink(...args),
}));

vi.mock("./use-product-media-sync", () => ({
  useProductMediaSync: () => ({ stage: mockStage, attach: mockAttach }),
}));

vi.mock("@/features/products/lib/product-form-dirty", () => ({
  isCatalogFormDirty: (...args: unknown[]) => mockIsCatalogFormDirty(...args),
}));

const seed: ProductFormValue = {
  product: {
    name: "Mug",
    category: { id: "cat-1", name: "Cat" },
    variants: [],
    standaloneVariant: { sku: "SKU-1", manageInventory: false },
  },
  variationTypes: [],
  medias: [
    {
      id: "keep",
      url: "https://cdn/keep.jpg",
      contentType: "image/jpeg",
      rank: 0,
      storageKey: "merchants/m/products/prod-1/keep.jpg",
    },
  ],
};

const values: ProductFormValue = {
  ...seed,
  medias: [
    seed.medias[0],
    {
      id: "new",
      url: "blob:1",
      contentType: "image/jpeg",
      rank: 1,
      file: new File(["x"], "extra.jpg", { type: "image/jpeg" }),
    },
  ],
};

describe("useProductUpdateSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDirtyFields.current = {};
    mockGetValues.mockReturnValue(values);
    mockCollectSlotFieldErrors.mockReturnValue({});
    mockMergeContributions.mockReturnValue({ pricingLines: [], inventoryLines: [] });
    mockBuildUpdateSellableProductRequest.mockReturnValue({
      productId: "prod-1",
      product: { name: "Mug" },
    });
    mockUseWorkflowAwaiter.mockReturnValue({ awaitWorkflow: mockAwaitWorkflow });
    mockUseCatalogLink.mockImplementation((rel: string) => {
      if (rel === "updateSellableProduct") return { href: "/workflows/update-sellable-product" };
      return undefined;
    });
    mockAwaitWorkflow.mockImplementation(async (trigger: (key: string) => Promise<unknown>) => {
      await trigger("idem-1");
    });
    mockMutateAsync.mockResolvedValue({ workflowId: "wf-1", status: "COMPLETED" });
    mockValidate.mockResolvedValue([{ valid: true }]);
    mockStage.mockResolvedValue({ status: "synced" });
    mockAttach.mockResolvedValue({ status: "synced" });
  });

  it("skips the saga when only the gallery is dirty", async () => {
    mockIsCatalogFormDirty.mockReturnValue(false);
    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(() =>
      useProductUpdateSubmit({
        productId: "prod-1",
        seed,
        onLifecycleEvent,
      }),
    );

    await result.current.submit();

    expect(mockAwaitWorkflow).not.toHaveBeenCalled();
    expect(mockStage).toHaveBeenCalled();
    expect(mockAttach).toHaveBeenCalledWith("prod-1");
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "updated" });
  });

  it("runs the saga then media when both are dirty", async () => {
    mockIsCatalogFormDirty.mockReturnValue(true);
    const onLifecycleEvent = vi.fn();
    const order: string[] = [];
    mockMutateAsync.mockImplementation(async () => {
      order.push("saga");
      return { workflowId: "wf-1", status: "COMPLETED" };
    });
    mockStage.mockImplementation(async () => {
      order.push("stage");
      return { status: "synced" };
    });
    mockAttach.mockImplementation(async () => {
      order.push("attach");
      return { status: "synced" };
    });

    const { result } = renderHook(() =>
      useProductUpdateSubmit({
        productId: "prod-1",
        seed,
        onLifecycleEvent,
      }),
    );

    await result.current.submit();

    expect(order).toEqual(["saga", "stage", "attach"]);
    expect(mockMutateAsync.mock.calls[0][0].request).not.toHaveProperty("medias");
    expect(mockAttach).toHaveBeenCalledWith("prod-1");
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "updated" });
  });

  it("does not throw when media fails after a successful saga", async () => {
    mockIsCatalogFormDirty.mockReturnValue(true);
    mockStage.mockResolvedValue({ status: "failed", error: new Error("Storage upload failed") });
    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(() =>
      useProductUpdateSubmit({
        productId: "prod-1",
        seed,
        onLifecycleEvent,
      }),
    );

    await result.current.submit();

    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "updateMediaFailed" });
    expect(onLifecycleEvent).not.toHaveBeenCalledWith({ type: "updated" });
  });
});
