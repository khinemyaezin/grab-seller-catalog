import { describe, expect, it } from "vitest";
import {
  isVariantMediaDirty,
  orderVariantMediaIds,
  toVariantGalleryItems,
} from "./variant-media";
import type { ProductMedia } from "@/features/products/types";

const gallery: ProductMedia[] = [
  { id: "m1", storageKey: "a.jpg", url: "http://cdn/a.jpg", contentType: "image/jpeg", rank: 0 },
  { id: "m2", storageKey: "b.jpg", url: "http://cdn/b.jpg", contentType: "image/jpeg", rank: 1 },
];

describe("orderVariantMediaIds", () => {
  it("puts the thumbnail first when it belongs to the subset", () => {
    expect(orderVariantMediaIds(["m1", "m2"], "m2")).toEqual(["m2", "m1"]);
  });

  it("drops duplicates and ignores a thumbnail that is not assigned", () => {
    expect(orderVariantMediaIds(["m1", "m1", "m2"], "m3")).toEqual(["m1", "m2"]);
  });
});

describe("toVariantGalleryItems", () => {
  it("maps assigned product media in mediaIds order", () => {
    expect(toVariantGalleryItems(gallery, ["m2", "m1"]).map((item) => item.id)).toEqual(["m2", "m1"]);
    expect(toVariantGalleryItems(gallery, ["m2", "m1"])[0].rank).toBe(0);
  });

  it("skips ids that are not in the product gallery", () => {
    expect(toVariantGalleryItems(gallery, ["missing", "m1"]).map((item) => item.id)).toEqual(["m1"]);
  });
});

describe("isVariantMediaDirty", () => {
  it("is clean when order and thumbnail match the seed", () => {
    expect(isVariantMediaDirty(
      { mediaIds: ["m1", "m2"], thumbnailMediaId: "m1" },
      { mediaIds: ["m1", "m2"], thumbnailMediaId: "m1" },
    )).toBe(false);
  });

  it("is dirty when the assigned subset or thumbnail changes", () => {
    expect(isVariantMediaDirty(
      { mediaIds: ["m2"], thumbnailMediaId: "m2" },
      { mediaIds: ["m1", "m2"], thumbnailMediaId: "m1" },
    )).toBe(true);
  });
});
