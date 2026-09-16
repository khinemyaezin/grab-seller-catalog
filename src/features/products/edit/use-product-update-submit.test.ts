import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProductUpdateSubmit } from "./use-product-update-submit";
import type { ProductFormValue } from "@/features/products/types";

const mockGetValues = vi.fn();
const mockDirtyFields: { current: Record<string, unknown> } = { current: {} };
const mockValidate = vi.fn();
const mockExecute = vi.fn();
const mockResetCommand = vi.fn();
const mockInvalidateProductQueries = vi.fn();
const mockQueryClient = {};
const mockMergeContributions = vi.fn();
const mockCollectSlotFieldErrors = vi.fn();
const mockBuildUpdateSellableProductRequest = vi.fn();
const mockStage = vi.fn();
const mockAttach = vi.fn();
const mockAttachDescriptions = vi.fn();
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

vi.mock("@/features/products/api/use-products", () => ({
  invalidateProductQueries: (...args: unknown[]) => mockInvalidateProductQueries(...args),
}));

vi.mock("@/features/products/lib/update-sellable-product-request", () => ({
  buildUpdateSellableProductRequest: (...args: unknown[]) =>
    mockBuildUpdateSellableProductRequest(...args),
}));

vi.mock("@/features/products/lib/update-product-request", () => ({
  determineUpdateIntent: () => "COLLAPSE_TO_STANDALONE",
}));

vi.mock("./use-product-update-command", () => ({
  useUpdateSellableProductCommand: () => ({
    execute: mockExecute,
    reset: mockResetCommand,
    isPending: false,
  }),
}));

vi.mock("@/features/products/use-workflow-awaiter", () => ({
  WorkflowTimeoutError: class WorkflowTimeoutError extends Error {},
}));

vi.mock("@/features/products/use-product-media-sync", () => ({
  useProductMediaSync: () => ({ stage: mockStage, attach: mockAttach }),
}));

vi.mock("@/features/products/use-product-description-sync", () => ({
  useProductDescriptionSync: () => ({ attach: mockAttachDescriptions }),
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
  descriptions: [
    {
      id: "desc-1",
      name: "overview",
      title: "Overview",
      description: "A handmade mug.",
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

const payload = {
  productId: "prod-1",
  product: { name: "Mug" },
};

describe("useProductUpdateSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDirtyFields.current = {};
    mockGetValues.mockReturnValue(values);
    mockCollectSlotFieldErrors.mockReturnValue({});
    mockMergeContributions.mockReturnValue({ pricingLines: [], inventoryLines: [] });
    mockBuildUpdateSellableProductRequest.mockReturnValue(payload);
    mockExecute.mockResolvedValue({ productId: "prod-1" });
    mockValidate.mockResolvedValue([{ valid: true }]);
    mockStage.mockResolvedValue({ status: "synced" });
    mockAttach.mockResolvedValue({ status: "synced" });
    mockAttachDescriptions.mockResolvedValue({ status: "synced" });
  });

  it("skips the command when only the gallery is dirty", async () => {
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

    expect(mockValidate).not.toHaveBeenCalled();
    expect(mockExecute).not.toHaveBeenCalled();
    expect(mockStage).toHaveBeenCalled();
    expect(mockAttach).toHaveBeenCalledWith("prod-1");
    expect(mockAttachDescriptions).toHaveBeenCalledWith("prod-1");
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "updated" });
  });

  it("runs the command then media when both are dirty", async () => {
    mockIsCatalogFormDirty.mockReturnValue(true);
    const onLifecycleEvent = vi.fn();
    const order: string[] = [];
    mockExecute.mockImplementation(async () => {
      order.push("command");
      return { productId: "prod-1" };
    });
    mockStage.mockImplementation(async () => {
      order.push("stage");
      return { status: "synced" };
    });
    mockAttach.mockImplementation(async () => {
      order.push("attach");
      return { status: "synced" };
    });
    mockAttachDescriptions.mockImplementation(async () => {
      order.push("descriptions");
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

    expect(order).toEqual(["command", "stage", "attach", "descriptions"]);
    expect(mockExecute).toHaveBeenCalledWith(payload);
    expect(mockAttach).toHaveBeenCalledWith("prod-1");
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "updated" });
  });

  it("does not execute the command when slot validation fails", async () => {
    mockIsCatalogFormDirty.mockReturnValue(true);
    mockValidate.mockResolvedValue([{ valid: false, groupId: "g1", slotId: "s1" }]);
    mockCollectSlotFieldErrors.mockReturnValue({ "g1::s1": ["Required"] });
    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(() =>
      useProductUpdateSubmit({
        productId: "prod-1",
        seed,
        onLifecycleEvent,
      }),
    );

    await expect(result.current.submit()).rejects.toThrow("Validation failed");
    expect(onLifecycleEvent).toHaveBeenCalledWith({
      type: "validationFailed",
      errors: { "g1::s1": ["Required"] },
    });
    expect(mockExecute).not.toHaveBeenCalled();
    expect(mockStage).not.toHaveBeenCalled();
  });

  it("does not throw when media fails after a successful command", async () => {
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

  it("throws when media fails and catalog is clean", async () => {
    mockIsCatalogFormDirty.mockReturnValue(false);
    mockStage.mockResolvedValue({ status: "failed", error: new Error("Storage upload failed") });
    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(() =>
      useProductUpdateSubmit({
        productId: "prod-1",
        seed,
        onLifecycleEvent,
      }),
    );

    await expect(result.current.submit()).rejects.toThrow("Storage upload failed");
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "updateMediaFailed" });
    expect(onLifecycleEvent).not.toHaveBeenCalledWith({ type: "updated" });
  });

  it("skips the command when only descriptions are dirty", async () => {
    mockIsCatalogFormDirty.mockReturnValue(false);
    mockStage.mockResolvedValue({ status: "skipped" });
    mockAttach.mockResolvedValue({ status: "skipped" });
    mockAttachDescriptions.mockResolvedValue({ status: "synced" });
    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(() =>
      useProductUpdateSubmit({
        productId: "prod-1",
        seed,
        onLifecycleEvent,
      }),
    );

    await result.current.submit();

    expect(mockExecute).not.toHaveBeenCalled();
    expect(mockAttachDescriptions).toHaveBeenCalledWith("prod-1");
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "updated" });
  });

  it("throws when description attach fails and catalog is clean", async () => {
    mockIsCatalogFormDirty.mockReturnValue(false);
    mockStage.mockResolvedValue({ status: "skipped" });
    mockAttach.mockResolvedValue({ status: "skipped" });
    mockAttachDescriptions.mockResolvedValue({
      status: "failed",
      error: new Error("Description replace failed"),
    });
    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(() =>
      useProductUpdateSubmit({
        productId: "prod-1",
        seed,
        onLifecycleEvent,
      }),
    );

    await expect(result.current.submit()).rejects.toThrow("Description replace failed");
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "updateDescriptionFailed" });
    expect(onLifecycleEvent).not.toHaveBeenCalledWith({ type: "updated" });
  });

  it("emits updateTimedOut when the command times out", async () => {
    mockIsCatalogFormDirty.mockReturnValue(true);
    const { WorkflowTimeoutError } = await import("@/features/products/use-workflow-awaiter");
    mockExecute.mockRejectedValue(new WorkflowTimeoutError("Timeout"));
    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(() =>
      useProductUpdateSubmit({
        productId: "prod-1",
        seed,
        onLifecycleEvent,
      }),
    );

    await expect(result.current.submit()).rejects.toThrow(WorkflowTimeoutError);
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "updateTimedOut" });
    expect(mockResetCommand).toHaveBeenCalled();
  });
});
