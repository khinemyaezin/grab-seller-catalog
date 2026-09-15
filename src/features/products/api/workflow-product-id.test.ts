import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveWorkflowProductId } from "./workflow-product-id";

const mockGetCreateSellableProduct = vi.fn();

vi.mock("./catalog", () => ({
  catalogService: {
    getCreateSellableProduct: (...args: unknown[]) => mockGetCreateSellableProduct(...args),
  },
}));

describe("resolveWorkflowProductId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses productId on the completed response", async () => {
    await expect(
      resolveWorkflowProductId({
        response: { workflowId: "wf-1", status: "COMPLETED", productId: "prod-1" },
      }),
    ).resolves.toBe("prod-1");
    expect(mockGetCreateSellableProduct).not.toHaveBeenCalled();
  });

  it("GETs the workflow when the POST body has no productId", async () => {
    const getLink = { href: "/workflows/create-sellable-product/wf-1" };
    mockGetCreateSellableProduct.mockResolvedValue({
      workflowId: "wf-1",
      status: "COMPLETED",
      productId: "prod-2",
    });

    await expect(
      resolveWorkflowProductId({
        response: {
          workflowId: "wf-1",
          status: "COMPLETED",
          _links: { "get-create-sellable-product": getLink },
        },
      }),
    ).resolves.toBe("prod-2");
    expect(mockGetCreateSellableProduct).toHaveBeenCalledWith(getLink);
  });

  it("throws when productId cannot be resolved", async () => {
    await expect(
      resolveWorkflowProductId({
        response: { workflowId: "wf-1", status: "COMPLETED" },
      }),
    ).rejects.toThrow("Missing product id after create");
  });
});
