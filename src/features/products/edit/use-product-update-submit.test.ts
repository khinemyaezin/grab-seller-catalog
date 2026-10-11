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
const mockIsCatalogFormDirty = vi.fn();
const mockExtensionDirty = false;
const mockDiffProductPublications = vi.fn();

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

vi.mock("@/features/products/lib/diff-product-publications", () => ({
  diffProductPublications: (...args: unknown[]) => mockDiffProductPublications(...args),
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
  useProductMediaSync: () => ({ stage: mockStage }),
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
};

const dirtyMediaValues: ProductFormValue = {
  ...seed,
  medias: [
    seed.medias[0],
    {
      id: "new",
      url: "https://cdn/extra.jpg",
      contentType: "image/jpeg",
      rank: 1,
      storageKey: "merchants/m/staged/extra.jpg",
    },
  ],
};

const dirtyDescriptionValues: ProductFormValue = {
  ...seed,
  descriptions: [
    {
      id: "desc-1",
      name: "overview",
      title: "Overview",
      description: "Updated copy.",
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
    mockDiffProductPublications.mockReturnValue({ publicationLines: [], unpublish: [] });
    mockExecute.mockResolvedValue({ productId: "prod-1" });
    mockValidate.mockResolvedValue([{ valid: true }]);
    mockStage.mockResolvedValue({ status: "synced" });
  });

  it("starts the workflow with medias when only the gallery is dirty", async () => {
    mockIsCatalogFormDirty.mockReturnValue(false);
    mockGetValues.mockReturnValue(dirtyMediaValues);
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
    expect(mockStage).toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledWith(payload);
    expect(mockBuildUpdateSellableProductRequest).toHaveBeenCalledWith(
      "prod-1",
      dirtyMediaValues,
      "COLLAPSE_TO_STANDALONE",
      {
        medias: [
          {
            id: "keep",
            storageKey: "merchants/m/products/prod-1/keep.jpg",
            contentType: "image/jpeg",
            rank: 0,
          },
          {
            id: "new",
            storageKey: "merchants/m/staged/extra.jpg",
            contentType: "image/jpeg",
            rank: 1,
          },
        ],
      },
    );
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "updated" });
  });

  it("stages then starts one update workflow when catalog and listing are dirty", async () => {
    mockIsCatalogFormDirty.mockReturnValue(true);
    mockGetValues.mockReturnValue(dirtyMediaValues);
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

    const { result } = renderHook(() =>
      useProductUpdateSubmit({
        productId: "prod-1",
        seed,
        onLifecycleEvent,
      }),
    );

    await result.current.submit();

    expect(order).toEqual(["stage", "command"]);
    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(mockExecute).toHaveBeenCalledWith(payload);
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

  it("throws when staging fails before the workflow starts", async () => {
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

    await expect(result.current.submit()).rejects.toThrow("Storage upload failed");
    expect(mockExecute).not.toHaveBeenCalled();
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "updateMediaFailed" });
    expect(onLifecycleEvent).not.toHaveBeenCalledWith({ type: "updated" });
  });

  it("starts the workflow with descriptions when only copy is dirty", async () => {
    mockIsCatalogFormDirty.mockReturnValue(false);
    mockGetValues.mockReturnValue(dirtyDescriptionValues);
    mockStage.mockResolvedValue({ status: "skipped" });
    const onLifecycleEvent = vi.fn();

    const { result } = renderHook(() =>
      useProductUpdateSubmit({
        productId: "prod-1",
        seed,
        onLifecycleEvent,
      }),
    );

    await result.current.submit();

    expect(mockExecute).toHaveBeenCalledWith(payload);
    expect(mockBuildUpdateSellableProductRequest).toHaveBeenCalledWith(
      "prod-1",
      dirtyDescriptionValues,
      "COLLAPSE_TO_STANDALONE",
      {
        descriptions: [
          {
            id: "desc-1",
            name: "overview",
            title: "Overview",
            description: "Updated copy.",
          },
        ],
      },
    );
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "updated" });
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

  it("passes added publication lines into the update payload", async () => {
    mockIsCatalogFormDirty.mockReturnValue(true);
    mockDiffProductPublications.mockReturnValue({
      publicationLines: [{ sku: "SKU-1", salesChannelId: "mkt-1" }],
      unpublish: [],
    });
    mockMergeContributions.mockReturnValue({ pricingLines: [], inventoryLines: [] });

    const { result } = renderHook(() =>
      useProductUpdateSubmit({
        productId: "prod-1",
        seed,
      }),
    );

    await result.current.submit();

    expect(mockBuildUpdateSellableProductRequest).toHaveBeenCalledWith(
      "prod-1",
      values,
      "COLLAPSE_TO_STANDALONE",
      {
        pricingLines: [],
        inventoryLines: [],
        publicationLines: [{ sku: "SKU-1", salesChannelId: "mkt-1" }],
      },
    );
  });

  it("passes removed channels as unpublishLines on the update payload", async () => {
    mockIsCatalogFormDirty.mockReturnValue(true);
    mockDiffProductPublications.mockReturnValue({
      publicationLines: [],
      unpublish: [{ sku: "SKU-1", salesChannelId: "web-1" }],
    });
    mockMergeContributions.mockReturnValue({ pricingLines: [], inventoryLines: [] });

    const { result } = renderHook(() =>
      useProductUpdateSubmit({
        productId: "prod-1",
        seed,
      }),
    );

    await result.current.submit();

    expect(mockBuildUpdateSellableProductRequest).toHaveBeenCalledWith(
      "prod-1",
      values,
      "COLLAPSE_TO_STANDALONE",
      {
        pricingLines: [],
        inventoryLines: [],
        unpublishLines: [{ sku: "SKU-1", salesChannelId: "web-1" }],
      },
    );
    expect(mockExecute).toHaveBeenCalled();
  });

  it("sends all current publication lines when activating a draft", async () => {
    mockIsCatalogFormDirty.mockReturnValue(true);
    mockDiffProductPublications.mockReturnValue({
      publicationLines: [{ sku: "SKU-1", salesChannelId: "mkt-1" }],
      unpublish: [{ sku: "SKU-1", salesChannelId: "web-1" }],
    });
    mockMergeContributions.mockReturnValue({ pricingLines: [], inventoryLines: [] });
    const activatingValues: ProductFormValue = {
      ...values,
      product: {
        ...values.product,
        status: "ACTIVE",
        publicationLines: [
          { sku: "SKU-1", salesChannelId: "web-1" },
          { sku: "SKU-1", salesChannelId: "mkt-1" },
        ],
      },
    };
    mockGetValues.mockReturnValue(activatingValues);
    const draftSeed: ProductFormValue = {
      ...seed,
      product: { ...seed.product, status: "DRAFT" },
    };

    const { result } = renderHook(() =>
      useProductUpdateSubmit({
        productId: "prod-1",
        seed: draftSeed,
      }),
    );

    await result.current.submit();

    expect(mockBuildUpdateSellableProductRequest).toHaveBeenCalledWith(
      "prod-1",
      activatingValues,
      "COLLAPSE_TO_STANDALONE",
      {
        pricingLines: [],
        inventoryLines: [],
        publicationLines: [
          { sku: "SKU-1", salesChannelId: "web-1" },
          { sku: "SKU-1", salesChannelId: "mkt-1" },
        ],
      },
    );
  });
});
