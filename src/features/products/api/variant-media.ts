import { catalogService } from "./catalog";
import type { HateoasLink } from "@khinemyaezin/seller-api";
import { isVariantMediaDirty } from "@/features/products/lib/variant-media";

export type VariantMediaSyncResult =
  | { status: "skipped" }
  | { status: "synced" }
  | { status: "failed"; error: Error };

export type AttachVariantMediaOptions = {
  link?: HateoasLink;
  mediaIds: string[];
  thumbnailMediaId?: string | null;
  seedMediaIds?: string[];
  seedThumbnailMediaId?: string | null;
};

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export async function attachVariantMedia({
  link,
  mediaIds,
  thumbnailMediaId,
  seedMediaIds = [],
  seedThumbnailMediaId = null,
}: AttachVariantMediaOptions): Promise<VariantMediaSyncResult> {
  if (!isVariantMediaDirty(
    { mediaIds, thumbnailMediaId },
    { mediaIds: seedMediaIds, thumbnailMediaId: seedThumbnailMediaId },
  )) {
    return { status: "skipped" };
  }

  if (!link) {
    return { status: "failed", error: new Error("Missing media links") };
  }

  try {
    await catalogService.setVariantMedia(link, {
      mediaIds,
      thumbnailMediaId: thumbnailMediaId ?? mediaIds[0] ?? null,
    });
    return { status: "synced" };
  } catch (error) {
    return { status: "failed", error: toError(error) };
  }
}
