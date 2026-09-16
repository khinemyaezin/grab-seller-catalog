import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUpdateSellableProductCommand } from "./use-product-update-command";
import type { UpdateSellableProductRequest } from "@/features/products/types";

const mockMutateAsync = vi.fn();
const mockResetMutation = vi.fn();
const mockAwaitWorkflow = vi.fn();
const mockUseWorkflowAwaiter = vi.fn();
const mockUseCatalogLink = vi.fn();

vi.mock("@/features/products/api/use-products", () => ({
  useUpdateSellableProductMutation: () => ({
    mutateAsync: mockMutateAsync,
    reset: mockResetMutation,
    isPending: false,
  }),
}));

vi.mock("@/features/products/use-workflow-awaiter", () => ({
  useWorkflowAwaiter: (...args: unknown[]) => mockUseWorkflowAwaiter(...args),
  WorkflowTimeoutError: class WorkflowTimeoutError extends Error {},
}));

vi.mock("@/features/products/api/use-root", () => ({
  useCatalogLink: (...args: unknown[]) => mockUseCatalogLink(...args),
}));

const payload: UpdateSellableProductRequest = {
  productId: "prod-1",
  product: {
    name: "Mug",
    categoryId: "cat-1",
    condition: "NEW",
    slug: "mug",
    variantSync: {
      intent: "COLLAPSE_TO_STANDALONE",
      overrides: [],
      variantTypes: [],
    },
  },
};

describe("useUpdateSellableProductCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWorkflowAwaiter.mockReturnValue({ awaitWorkflow: mockAwaitWorkflow });
    mockAwaitWorkflow.mockImplementation(async (trigger: (key: string) => Promise<unknown>) => {
      await trigger("idem-123");
    });
    mockUseCatalogLink.mockReturnValue({ href: "/workflows/update-sellable-product" });
    mockMutateAsync.mockResolvedValue({ workflowId: "wf-1", status: "COMPLETED" });
  });

  it("throws when update link is missing", async () => {
    mockUseCatalogLink.mockReturnValue(undefined);
    const { result } = renderHook(() => useUpdateSellableProductCommand());

    await expect(result.current.execute(payload)).rejects.toThrow("Missing update link");
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("posts the payload with an idempotency key and returns productId", async () => {
    const { result } = renderHook(() => useUpdateSellableProductCommand());

    await expect(result.current.execute(payload)).resolves.toEqual({ productId: "prod-1" });
    expect(mockUseWorkflowAwaiter).toHaveBeenCalledWith({
      workflowName: "update-sellable-product",
    });
    expect(mockMutateAsync).toHaveBeenCalledWith({
      link: { href: "/workflows/update-sellable-product" },
      request: {
        ...payload,
        idempotencyKey: "idem-123",
      },
    });
    expect(mockResetMutation).toHaveBeenCalled();
  });

  it("propagates a workflow timeout", async () => {
    const { WorkflowTimeoutError } = await import("@/features/products/use-workflow-awaiter");
    mockAwaitWorkflow.mockRejectedValue(new WorkflowTimeoutError("Timeout"));
    const { result } = renderHook(() => useUpdateSellableProductCommand());

    await expect(result.current.execute(payload)).rejects.toThrow(WorkflowTimeoutError);
    expect(mockResetMutation).not.toHaveBeenCalled();
  });
});
