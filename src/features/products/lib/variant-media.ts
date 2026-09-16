import { toMediaGalleryItems, type MediaGalleryItem } from "@khinemyaezin/seller-ui/components/media-gallery";
import type { ProductMedia } from "@/features/products/types";

export function orderVariantMediaIds(
  mediaIds: string[] | null | undefined,
  thumbnailMediaId?: string | null,
): string[] {
  const unique = [...new Set((mediaIds ?? []).filter(Boolean))];
  if (!thumbnailMediaId || !unique.includes(thumbnailMediaId)) {
    return unique;
  }
  return [thumbnailMediaId, ...unique.filter((id) => id !== thumbnailMediaId)];
}

export function toVariantGalleryItems(
  productMedias: ProductMedia[] | null | undefined,
  mediaIds: string[] | null | undefined,
): MediaGalleryItem[] {
  const byId = new Map((productMedias ?? []).map((media) => [media.id, media]));
  return (mediaIds ?? [])
    .map((id, rank) => {
      const media = byId.get(id);
      if (!media) {
        return null;
      }
      return {
        ...toMediaGalleryItems([media])[0],
        rank,
      };
    })
    .filter((item): item is MediaGalleryItem => item != null);
}

export function isVariantMediaDirty(
  current: { mediaIds?: string[] | null; thumbnailMediaId?: string | null },
  seed: { mediaIds?: string[] | null; thumbnailMediaId?: string | null },
): boolean {
  const currentIds = orderVariantMediaIds(current.mediaIds, current.thumbnailMediaId);
  const seedIds = orderVariantMediaIds(seed.mediaIds, seed.thumbnailMediaId);
  const currentThumbnail = current.thumbnailMediaId ?? currentIds[0] ?? null;
  const seedThumbnail = seed.thumbnailMediaId ?? seedIds[0] ?? null;
  return currentIds.join("\0") !== seedIds.join("\0") || currentThumbnail !== seedThumbnail;
}
