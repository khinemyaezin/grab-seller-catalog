import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProductCreateSubmit } from "./use-product-create-submit";

const mockGetValues = vi.fn();
const mockValidate = vi.fn();
const mockExecute = vi.fn();
const mockResetCommand = vi.fn();
const mockInvalidateProductQueries = vi.fn();
const mockQueryClient = {};
const mockMergeContributions = vi.fn();
const mockCollectSlotFieldErrors = vi.fn();
const mockBuildCreateSellableProductRequest = vi.fn();
const mockStage = vi.fn();
const mockAttach = vi.fn();
const mockAttachDescriptions = vi.fn();

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

vi.mock("@/features/products/lib/create-sellable-product-request", () => ({
  buildCreateSellableProductRequest: (...args: unknown[]) =>
    mockBuildCreateSellableProductRequest(...args),
}));

vi.mock("./use-product-create-command", () => ({
  useCreateSellableProductCommand: () => ({
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
  descriptions: [
    { name: "overview", title: "Overview", description: "A handmade mug." },
  ],
};

const payload = {
  product: { name: "Mug" },
  variantTypes: [],
  pricingLines: [],
  inventoryLines: [],
};

describe("useProductCreateSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetValues.mockReturnValue(formValues);
    mockCollectSlotFieldErrors.mockReturnValue({});
    mockMergeContributions.mockReturnValue({ pricingLines: [], inventoryLines: [] });
    mockBuildCreateSellableProductRequest.mockReturnValue(payload);
    mockExecute.mockResolvedValue({ productId: "prod-1" });
    mockStage.mockResolvedValue({ status: "synced" });
    mockAttach.mockResolvedValue({ status: "synced" });
    mockAttachDescriptions.mockResolvedValue({ status: "synced" });
    mockValidate.mockResolvedValue([{ valid: true, groupId: "g1", slotId: "s1" }]);
  });

  it("stages before create and does not put medias on the command payload", async () => {
    const onLifecycleEvent = vi.fn();
    const order: string[] = [];
    mockStage.mockImplementation(async () => {
      order.push("stage");
      return { status: "synced" };
    });
    mockExecute.mockImplementation(async () => {
      order.push("create");
      return { productId: "prod-1" };
    });
    mockAttach.mockImplementation(async (productId: string) => {
      order.push(`attach:${productId}`);
      return { status: "synced" };
    });
    mockAttachDescriptions.mockImplementation(async (productId: string) => {
      order.push(`descriptions:${productId}`);
      return { status: "synced" };
    });
    const { result } = renderHook(() =>
      useProductCreateSubmit({
        link: { href: "/workflows/create-sellable-product" },
        onLifecycleEvent,
      }),
    );

    await result.current.submit();

    expect(order).toEqual(["stage", "create", "attach:prod-1", "descriptions:prod-1"]);
    expect(mockBuildCreateSellableProductRequest).toHaveBeenCalledWith(
      formValues,
      { pricingLines: [], inventoryLines: [] },
    );
    expect(mockExecute).toHaveBeenCalledWith(payload);
    expect(payload).not.toHaveProperty("medias");
    expect(payload).not.toHaveProperty("descriptions");
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "created", productId: "prod-1" });
    expect(mockInvalidateProductQueries).toHaveBeenCalledWith(mockQueryClient, "prod-1");
  });

  it("does not execute the command when slot validation fails", async () => {
    mockValidate.mockResolvedValue([{ valid: false, groupId: "g1", slotId: "s1" }]);
    mockCollectSlotFieldErrors.mockReturnValue({ "g1::s1": ["Required"] });
    const onLifecycleEvent = vi.fn();
    const { result } = renderHook(() =>
      useProductCreateSubmit({
        link: { href: "/workflows/create-sellable-product" },
        onLifecycleEvent,
      }),
    );

    await expect(result.current.submit()).rejects.toThrow("Validation failed");
    expect(onLifecycleEvent).toHaveBeenCalledWith({
      type: "validationFailed",
      errors: { "g1::s1": ["Required"] },
    });
    expect(mockStage).not.toHaveBeenCalled();
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("throws on stage failure and does not create a product", async () => {
    mockStage.mockResolvedValue({ status: "failed", error: new Error("Storage upload failed (403)") });
    const onLifecycleEvent = vi.fn();
    const { result } = renderHook(() =>
      useProductCreateSubmit({
        link: { href: "/workflows/create-sellable-product" },
        onLifecycleEvent,
      }),
    );

    await expect(result.current.submit()).rejects.toThrow("Storage upload failed (403)");
    expect(mockExecute).not.toHaveBeenCalled();
    expect(mockAttach).not.toHaveBeenCalled();
    expect(mockAttachDescriptions).not.toHaveBeenCalled();
    expect(onLifecycleEvent).not.toHaveBeenCalledWith({ type: "created", productId: "prod-1" });
    expect(onLifecycleEvent).not.toHaveBeenCalledWith({ type: "createFailed" });
  });

  it("emits createMediaFailed and still invalidates when attach fails", async () => {
    mockAttach.mockResolvedValue({ status: "failed", error: new Error("Storage upload failed (403)") });
    const onLifecycleEvent = vi.fn();
    const { result } = renderHook(() =>
      useProductCreateSubmit({
        link: { href: "/workflows/create-sellable-product" },
        onLifecycleEvent,
      }),
    );

    await result.current.submit();

    expect(mockExecute).toHaveBeenCalled();
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "createMediaFailed", productId: "prod-1" });
    expect(onLifecycleEvent).not.toHaveBeenCalledWith({ type: "created", productId: "prod-1" });
  });

  it("emits createDescriptionFailed when description attach fails after a successful media attach", async () => {
    mockAttachDescriptions.mockResolvedValue({ status: "failed", error: new Error("Description replace failed") });
    const onLifecycleEvent = vi.fn();
    const { result } = renderHook(() =>
      useProductCreateSubmit({
        link: { href: "/workflows/create-sellable-product" },
        onLifecycleEvent,
      }),
    );

    await result.current.submit();

    expect(mockExecute).toHaveBeenCalled();
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "createDescriptionFailed", productId: "prod-1" });
    expect(onLifecycleEvent).not.toHaveBeenCalledWith({ type: "created", productId: "prod-1" });
  });

  it("emits createTimedOut when the command times out", async () => {
    const { WorkflowTimeoutError } = await import("@/features/products/use-workflow-awaiter");
    mockExecute.mockRejectedValue(new WorkflowTimeoutError("Timeout"));
    const onLifecycleEvent = vi.fn();
    const { result } = renderHook(() =>
      useProductCreateSubmit({
        link: { href: "/workflows/create-sellable-product" },
        onLifecycleEvent,
      }),
    );

    await expect(result.current.submit()).rejects.toThrow(WorkflowTimeoutError);
    expect(onLifecycleEvent).toHaveBeenCalledWith({ type: "createTimedOut" });
    expect(mockResetCommand).toHaveBeenCalled();
  });
});
