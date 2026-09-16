import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProductDescriptionSync } from "./use-product-description-sync";
import type { ProductDescription } from "@/features/products/types";

const mockGetValues = vi.fn();
const mockUseCatalogLink = vi.fn();
const mockAttachProductDescriptions = vi.fn();
const mockIsDescriptionsDirty = vi.fn();

vi.mock("react-hook-form", () => ({
  useFormContext: () => ({ getValues: mockGetValues }),
}));

vi.mock("./use-root", () => ({
  useCatalogLink: (...args: unknown[]) => mockUseCatalogLink(...args),
}));

vi.mock("@/features/products/api/product-descriptions", () => ({
  attachProductDescriptions: (...args: unknown[]) => mockAttachProductDescriptions(...args),
  isDescriptionsDirty: (...args: unknown[]) => mockIsDescriptionsDirty(...args),
}));

const items: ProductDescription[] = [
  { name: "overview", title: "Overview", description: "Soft cotton shirt" },
];
const replaceLink = { href: "/catalog/products/{productId}/descriptions", templated: true };

describe("useProductDescriptionSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetValues.mockImplementation((name?: string) => (name === "descriptions" ? items : undefined));
    mockUseCatalogLink.mockImplementation((rel: string) => {
      if (rel === "replaceProductDescriptions") return replaceLink;
      return undefined;
    });
    mockIsDescriptionsDirty.mockReturnValue(true);
    mockAttachProductDescriptions.mockResolvedValue(undefined);
  });

  it("attaches with productId and prefers product replace link", async () => {
    const productReplace = { href: "/products/prod-1/descriptions" };
    const { result } = renderHook(() =>
      useProductDescriptionSync({
        actions: {
          "replace-product-descriptions": productReplace,
        },
      }),
    );

    await expect(result.current.attach("prod-1")).resolves.toEqual({ status: "synced" });
    expect(mockAttachProductDescriptions).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "prod-1",
        items,
        replaceDescriptionsLink: productReplace,
      }),
    );
  });

  it("skips attach when descriptions are unchanged", async () => {
    mockIsDescriptionsDirty.mockReturnValue(false);
    const { result } = renderHook(() => useProductDescriptionSync());

    await expect(result.current.attach("prod-1")).resolves.toEqual({ status: "skipped" });
    expect(mockAttachProductDescriptions).not.toHaveBeenCalled();
  });

  it("returns failed when the replace link is missing", async () => {
    mockUseCatalogLink.mockReturnValue(undefined);
    const { result } = renderHook(() => useProductDescriptionSync());

    const descriptions = await result.current.attach("prod-1");
    expect(descriptions).toMatchObject({ status: "failed" });
    expect(descriptions.status === "failed" && descriptions.error.message).toBe(
      "Missing description links",
    );
    expect(mockAttachProductDescriptions).not.toHaveBeenCalled();
  });
});
