import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCreateSellableProductCommand } from "./use-product-create-command";
import type { CreateSellableProductRequest } from "@/features/products/types";

const mockMutateAsync = vi.fn();
const mockResetMutation = vi.fn();
const mockAwaitWorkflow = vi.fn();
const mockResolveWorkflowProductId = vi.fn();
const mockUseWorkflowAwaiter = vi.fn();

vi.mock("@/features/products/api/use-products", () => ({
  useCreateSellableProductMutation: () => ({
    mutateAsync: mockMutateAsync,
    reset: mockResetMutation,
    isPending: false,
  }),
}));

vi.mock("@/features/products/use-workflow-awaiter", () => ({
  useWorkflowAwaiter: (...args: unknown[]) => mockUseWorkflowAwaiter(...args),
  WorkflowTimeoutError: class WorkflowTimeoutError extends Error {},
}));

vi.mock("@/features/products/api/workflow-product-id", () => ({
  resolveWorkflowProductId: (...args: unknown[]) => mockResolveWorkflowProductId(...args),
}));

const payload: CreateSellableProductRequest = {
  product: {
    name: "Mug",
    categoryId: "cat-1",
    condition: "NEW",
    slug: "mug",
    variants: [{ sku: "SKU-1", variations: [], manageInventory: false }],
  },
  variantTypes: [],
  pricingLines: [],
  inventoryLines: [],
};

describe("useCreateSellableProductCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it("posts the payload with an idempotency key and returns productId", async () => {
    const link = { href: "/workflows/create-sellable-product" };
    const { result } = renderHook(() => useCreateSellableProductCommand(link));

    await expect(result.current.execute(payload)).resolves.toEqual({ productId: "prod-1" });

    expect(mockUseWorkflowAwaiter).toHaveBeenCalledWith({
      workflowName: "create-sellable-product",
    });
    expect(mockMutateAsync).toHaveBeenCalledWith({
      link,
      request: { ...payload, idempotencyKey: "idem-1" },
    });
    expect(mockResolveWorkflowProductId).toHaveBeenCalled();
    expect(mockResetMutation).toHaveBeenCalled();
  });

  it("propagates a workflow timeout", async () => {
    const { WorkflowTimeoutError } = await import("@/features/products/use-workflow-awaiter");
    mockAwaitWorkflow.mockRejectedValue(new WorkflowTimeoutError("Timeout"));
    const { result } = renderHook(() =>
      useCreateSellableProductCommand({ href: "/workflows/create-sellable-product" }),
    );

    await expect(result.current.execute(payload)).rejects.toThrow(WorkflowTimeoutError);
    expect(mockResetMutation).not.toHaveBeenCalled();
  });

  it("propagates a failed workflow", async () => {
    mockAwaitWorkflow.mockRejectedValue(new Error("Workflow execution failed"));
    const { result } = renderHook(() =>
      useCreateSellableProductCommand({ href: "/workflows/create-sellable-product" }),
    );

    await expect(result.current.execute(payload)).rejects.toThrow("Workflow execution failed");
  });
});
