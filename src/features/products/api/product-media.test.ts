import { beforeEach, describe, expect, it, vi } from "vitest";
import { attachProductMedia, isGalleryDirty, stageProductMedia } from "./product-media";
import type { ProductMediaFormItem } from "@/features/products/types";

const mockCreateProductMediaUpload = vi.fn();
const mockReplaceProductMedia = vi.fn();
const mockPutPresignedObject = vi.fn();

vi.mock("./catalog", () => ({
  catalogService: {
    createProductMediaUpload: (...args: unknown[]) => mockCreateProductMediaUpload(...args),
    replaceProductMedia: (...args: unknown[]) => mockReplaceProductMedia(...args),
  },
}));

vi.mock("./storage", () => ({
  putPresignedObject: (...args: unknown[]) => mockPutPresignedObject(...args),
}));

const uploadLink = {
  href: "/catalog/media/uploads",
};
const replaceLink = {
  href: "/catalog/products/{productId}/media",
  templated: true,
};

function remoteItem(overrides: Partial<ProductMediaFormItem> = {}): ProductMediaFormItem {
  return {
    id: "remote",
    url: "https://cdn/a.jpg",
    contentType: "image/jpeg",
    rank: 0,
    storageKey: "merchants/m/products/prod-1/a.jpg",
    ...overrides,
  };
}

describe("isGalleryDirty", () => {
  it("is false when items match the seed", () => {
    const items = [remoteItem()];
    expect(isGalleryDirty(items, items)).toBe(false);
  });

  it("is true when a local file is present", () => {
    expect(
      isGalleryDirty([
        {
          id: "new",
          url: "blob:1",
          contentType: "image/jpeg",
          rank: 0,
          file: new File(["x"], "hero.jpg", { type: "image/jpeg" }),
        },
      ]),
    ).toBe(true);
  });

  it("is true when an item is dropped", () => {
    expect(isGalleryDirty([], [remoteItem()])).toBe(true);
  });
});

describe("stageProductMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("authorizes against the staged catalog link without a productId", async () => {
    const file = new File(["2"], "first.jpg", { type: "image/jpeg" });
    mockCreateProductMediaUpload.mockResolvedValue({
      url: "https://s3/a",
      method: "PUT",
      requiredHeaders: { "Content-Type": "image/jpeg" },
      storageKey: "merchants/m/staged/new.jpg",
    });
    mockPutPresignedObject.mockResolvedValue(undefined);

    const keys = await stageProductMedia({
      items: [
        { id: "new", url: "blob:1", contentType: "image/jpeg", name: "first.jpg", file, rank: 0, sizeBytes: 2 },
      ],
      createUploadLink: uploadLink,
    });

    expect(mockCreateProductMediaUpload.mock.calls[0][0].href).toBe("/catalog/media/uploads");
    expect(mockCreateProductMediaUpload.mock.calls[0][0].href).not.toContain("products/");
    expect(mockCreateProductMediaUpload.mock.calls[0][1]).toEqual({
      filename: "first.jpg",
      contentType: "image/jpeg",
      sizeBytes: 2,
    });
    expect(mockPutPresignedObject).toHaveBeenCalledWith(
      "https://s3/a",
      file,
      { "Content-Type": "image/jpeg" },
      "PUT",
    );
    expect(keys.get("new")).toBe("merchants/m/staged/new.jpg");
    expect(mockReplaceProductMedia).not.toHaveBeenCalled();
  });

  it("skips items that already have a storageKey", async () => {
    await stageProductMedia({
      items: [
        {
          id: "new",
          url: "blob:1",
          contentType: "image/jpeg",
          rank: 0,
          file: new File(["x"], "hero.jpg", { type: "image/jpeg" }),
          storageKey: "merchants/m/staged/already.jpg",
        },
      ],
      createUploadLink: uploadLink,
    });

    expect(mockCreateProductMediaUpload).not.toHaveBeenCalled();
  });

  it("re-presigns and retries a failed PUT", async () => {
    const file = new File(["1"], "hero.jpg", { type: "image/jpeg" });
    mockCreateProductMediaUpload
      .mockResolvedValueOnce({
        url: "https://s3/expired",
        method: "PUT",
        requiredHeaders: { "Content-Type": "image/jpeg" },
        storageKey: "merchants/m/staged/a.jpg",
      })
      .mockResolvedValueOnce({
        url: "https://s3/fresh",
        method: "PUT",
        requiredHeaders: { "Content-Type": "image/jpeg" },
        storageKey: "merchants/m/staged/b.jpg",
      });
    mockPutPresignedObject
      .mockRejectedValueOnce(new Error("Storage upload failed (403)"))
      .mockResolvedValueOnce(undefined);

    const keys = await stageProductMedia({
      items: [
        { id: "1", url: "blob:1", contentType: "image/jpeg", name: "hero.jpg", file, rank: 0, sizeBytes: 1 },
      ],
      createUploadLink: uploadLink,
    });

    expect(mockCreateProductMediaUpload).toHaveBeenCalledTimes(2);
    expect(mockPutPresignedObject).toHaveBeenNthCalledWith(
      2,
      "https://s3/fresh",
      file,
      { "Content-Type": "image/jpeg" },
      "PUT",
    );
    expect(keys.get("1")).toBe("merchants/m/staged/b.jpg");
  });

  it("throws when a PUT still fails after retries", async () => {
    mockCreateProductMediaUpload.mockResolvedValue({
      url: "https://s3/a",
      method: "PUT",
      requiredHeaders: {},
      storageKey: "merchants/m/staged/a.jpg",
    });
    mockPutPresignedObject.mockRejectedValue(new Error("Storage upload failed (403)"));

    await expect(
      stageProductMedia({
        items: [
          {
            id: "1",
            url: "blob:1",
            contentType: "image/jpeg",
            name: "hero.jpg",
            file: new File(["1"], "hero.jpg", { type: "image/jpeg" }),
            rank: 0,
          },
        ],
        createUploadLink: uploadLink,
      }),
    ).rejects.toThrow("Storage upload failed (403)");

    expect(mockCreateProductMediaUpload).toHaveBeenCalledTimes(3);
    expect(mockReplaceProductMedia).not.toHaveBeenCalled();
  });
});

describe("attachProductMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips when the gallery is unchanged", async () => {
    const items = [remoteItem()];
    await attachProductMedia({
      productId: "prod-1",
      items,
      seed: items,
      replaceMediaLink: replaceLink,
    });

    expect(mockReplaceProductMedia).not.toHaveBeenCalled();
  });

  it("replaces kept and staged items using storageKeys", async () => {
    const kept = remoteItem({ id: "keep", rank: 1, storageKey: "merchants/m/products/prod-1/keep.jpg" });
    const dropped = remoteItem({ id: "drop", rank: 0, storageKey: "merchants/m/products/prod-1/drop.jpg" });
    const file = new File(["2"], "first.jpg", { type: "image/jpeg" });
    mockReplaceProductMedia.mockResolvedValue({ productId: "prod-1", medias: [] });

    await attachProductMedia({
      productId: "prod-1",
      items: [
        {
          id: "new",
          url: "blob:1",
          contentType: "image/jpeg",
          name: "first.jpg",
          file,
          rank: 0,
          sizeBytes: 2,
          storageKey: "merchants/m/staged/new.jpg",
        },
        kept,
      ],
      seed: [dropped, kept],
      replaceMediaLink: replaceLink,
    });

    expect(mockCreateProductMediaUpload).not.toHaveBeenCalled();
    expect(mockReplaceProductMedia.mock.calls[0][0].href).toBe("/catalog/products/prod-1/media");
    expect(mockReplaceProductMedia.mock.calls[0][1]).toEqual({
      medias: [
        { storageKey: "merchants/m/staged/new.jpg", contentType: "image/jpeg", rank: 0 },
        {
          id: "keep",
          storageKey: "merchants/m/products/prod-1/keep.jpg",
          contentType: "image/jpeg",
          rank: 1,
        },
      ],
    });
  });

  it("replaces with an empty gallery when every image is dropped", async () => {
    mockReplaceProductMedia.mockResolvedValue({ productId: "prod-1", medias: [] });

    await attachProductMedia({
      productId: "prod-1",
      items: [],
      seed: [remoteItem()],
      replaceMediaLink: replaceLink,
    });

    expect(mockCreateProductMediaUpload).not.toHaveBeenCalled();
    expect(mockReplaceProductMedia.mock.calls[0][1]).toEqual({ medias: [] });
  });
});
