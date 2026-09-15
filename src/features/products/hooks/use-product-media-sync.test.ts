import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProductMediaSync } from "./use-product-media-sync";
import type { ProductMediaFormItem } from "@/features/products/types";

const mockGetValues = vi.fn();
const mockSetValue = vi.fn();
const mockUseCatalogLink = vi.fn();
const mockStageProductMedia = vi.fn();
const mockAttachProductMedia = vi.fn();
const mockIsGalleryDirty = vi.fn();

vi.mock("react-hook-form", () => ({
  useFormContext: () => ({ getValues: mockGetValues, setValue: mockSetValue }),
}));

vi.mock("./use-root", () => ({
  useCatalogLink: (...args: unknown[]) => mockUseCatalogLink(...args),
}));

vi.mock("@/features/products/api/product-media", () => ({
  stageProductMedia: (...args: unknown[]) => mockStageProductMedia(...args),
  attachProductMedia: (...args: unknown[]) => mockAttachProductMedia(...args),
  isGalleryDirty: (...args: unknown[]) => mockIsGalleryDirty(...args),
}));

const items: ProductMediaFormItem[] = [
  {
    id: "1",
    url: "blob:1",
    contentType: "image/jpeg",
    rank: 0,
    file: new File(["x"], "hero.jpg", { type: "image/jpeg" }),
  },
];

const uploadLink = { href: "/catalog/media/uploads" };
const replaceLink = { href: "/catalog/products/{productId}/media", templated: true };

describe("useProductMediaSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetValues.mockImplementation((name?: string) => (name === "medias" ? items : undefined));
    mockUseCatalogLink.mockImplementation((rel: string) => {
      if (rel === "createStagedMediaUpload") return uploadLink;
      if (rel === "replaceProductMedia") return replaceLink;
      return undefined;
    });
    mockIsGalleryDirty.mockReturnValue(true);
    mockStageProductMedia.mockResolvedValue(new Map());
    mockAttachProductMedia.mockResolvedValue(undefined);
  });

  it("skips stage when there is no local file without a storageKey", async () => {
    mockGetValues.mockImplementation((name?: string) =>
      name === "medias" ? [ { ...items[0], file: undefined, storageKey: "merchants/m/products/p/a.jpg" } ] : undefined,
    );
    const { result } = renderHook(() => useProductMediaSync());

    await expect(result.current.stage()).resolves.toEqual({ status: "skipped" });
    expect(mockStageProductMedia).not.toHaveBeenCalled();
  });

  it("stages without a productId and writes storageKey onto the form", async () => {
    mockStageProductMedia.mockImplementation(async (options: { onStaged?: Function }) => {
      options.onStaged?.("1", "merchants/m/staged/a.jpg");
    });
    const { result } = renderHook(() => useProductMediaSync());

    await expect(result.current.stage()).resolves.toEqual({ status: "synced" });
    expect(mockStageProductMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        items,
        createUploadLink: uploadLink,
      }),
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      "medias",
      [{ ...items[0], storageKey: "merchants/m/staged/a.jpg", status: "done" }],
      { shouldDirty: true, shouldValidate: false },
    );
  });

  it("patches item status through onItemStatus", async () => {
    mockStageProductMedia.mockImplementation(async (options: { onItemStatus?: Function }) => {
      options.onItemStatus?.("1", "uploading");
    });
    const { result } = renderHook(() => useProductMediaSync());

    await result.current.stage();

    expect(mockSetValue).toHaveBeenCalledWith(
      "medias",
      [{ ...items[0], status: "uploading", error: undefined }],
      { shouldDirty: true, shouldValidate: false },
    );
  });

  it("returns failed when the staged upload link is missing", async () => {
    mockUseCatalogLink.mockReturnValue(undefined);
    const { result } = renderHook(() => useProductMediaSync());

    const media = await result.current.stage();
    expect(media).toMatchObject({ status: "failed" });
    expect(media.status === "failed" && media.error.message).toBe("Missing media links");
    expect(mockStageProductMedia).not.toHaveBeenCalled();
  });

  it("returns failed when stageProductMedia throws", async () => {
    mockStageProductMedia.mockRejectedValue(new Error("Storage upload failed (403)"));
    const { result } = renderHook(() => useProductMediaSync());

    await expect(result.current.stage()).resolves.toEqual({
      status: "failed",
      error: expect.objectContaining({ message: "Storage upload failed (403)" }),
    });
  });

  it("attaches with productId and prefers product replace link", async () => {
    const productReplace = { href: "/products/prod-1/media" };
    const { result } = renderHook(() =>
      useProductMediaSync({
        actions: {
          "replace-product-media": productReplace,
        },
      }),
    );

    await expect(result.current.attach("prod-1")).resolves.toEqual({ status: "synced" });
    expect(mockAttachProductMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "prod-1",
        items,
        replaceMediaLink: productReplace,
      }),
    );
  });

  it("skips attach when the gallery is unchanged", async () => {
    mockIsGalleryDirty.mockReturnValue(false);
    const { result } = renderHook(() => useProductMediaSync());

    await expect(result.current.attach("prod-1")).resolves.toEqual({ status: "skipped" });
    expect(mockAttachProductMedia).not.toHaveBeenCalled();
  });
});
