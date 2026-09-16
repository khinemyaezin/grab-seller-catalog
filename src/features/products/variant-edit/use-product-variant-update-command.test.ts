import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUpdateProductVariantCommand } from "./use-product-variant-update-command";
import type { UpdateProductVariantRequest } from "@/features/products/types";

const mockMutateAsync = vi.fn();
const mockResetMutation = vi.fn();
const mockAwaitWorkflow = vi.fn();
const mockUseWorkflowAwaiter = vi.fn();
const mockUseCatalogLink = vi.fn();

vi.mock("@/features/products/api/use-products", () => ({
  useUpdateProductVariantMutation: () => ({
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

const payload = {
  productId: "prod-1",
  variantId: "var-1",
  sku: "SKU-1",
} as UpdateProductVariantRequest;

describe("useUpdateProductVariantCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWorkflowAwaiter.mockReturnValue({ awaitWorkflow: mockAwaitWorkflow });
    mockAwaitWorkflow.mockImplementation(async (trigger: (key: string) => Promise<unknown>) => {
      await trigger("idem-1");
    });
    mockUseCatalogLink.mockReturnValue({ href: "/api/v1/workflows/update-product-variant" });
    mockMutateAsync.mockResolvedValue({ workflowId: "wf-1", status: "COMPLETED" });
  });

  it("throws when the update link is missing", async () => {
    mockUseCatalogLink.mockReturnValue(undefined);
    const { result } = renderHook(() => useUpdateProductVariantCommand());

    await expect(result.current.execute(payload)).rejects.toThrow("Missing update link");
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("posts the payload with an idempotency key", async () => {
    const updateLink = { href: "/api/v1/workflows/update-product-variant" };
    const { result } = renderHook(() => useUpdateProductVariantCommand());

    await result.current.execute(payload);

    expect(mockUseWorkflowAwaiter).toHaveBeenCalledWith({
      workflowName: "update-product-variant",
    });
    expect(mockMutateAsync).toHaveBeenCalledWith({
      link: updateLink,
      request: { ...payload, idempotencyKey: "idem-1" },
    });
    expect(mockResetMutation).toHaveBeenCalled();
  });
});
