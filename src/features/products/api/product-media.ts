import { resolveUrlTemplate, type HateoasLink } from "@khinemyaezin/seller-api";
import { catalogService } from "@/features/products/api/catalog";
import { putPresignedObject } from "@/features/products/api/storage";
import type {
  CreateProductMediaUploadRequest,
  ProductMediaFormItem,
  ProductMediaUploadResponse,
  ReplaceProductMediaRequest,
} from "@/features/products/types";
import type { MediaGalleryItemStatus } from "@khinemyaezin/seller-ui/components/media-gallery";

export const PRODUCT_MEDIA_UPLOAD_ATTEMPTS = 3;

export type ProductMediaItemStatusHandler = (
  id: string,
  status: MediaGalleryItemStatus,
  error?: string,
) => void;

export type StageProductMediaOptions = {
  items: ProductMediaFormItem[];
  createUploadLink: HateoasLink;
  onItemStatus?: ProductMediaItemStatusHandler;
  onStaged?: (id: string, storageKey: string) => void;
};

export type AttachProductMediaOptions = {
  productId: string;
  items: ProductMediaFormItem[];
  seed?: ProductMediaFormItem[];
  replaceMediaLink: HateoasLink;
};

function sortedByRank(items: ProductMediaFormItem[]): ProductMediaFormItem[] {
  return [...items].sort((left, right) => left.rank - right.rank);
}

export function isGalleryDirty(
  items: ProductMediaFormItem[],
  seed: ProductMediaFormItem[] = [],
): boolean {
  if (items.some((item) => item.file)) return true;
  if (items.length !== seed.length) return true;
  return items.some((item, index) => {
    const previous = seed[index];
    return (
      item.id !== previous?.id ||
      item.rank !== previous?.rank ||
      item.storageKey !== previous?.storageKey
    );
  });
}

function uploadErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Storage upload failed";
}

export function authorizeStagedUpload(
  link: HateoasLink,
  metadata: CreateProductMediaUploadRequest,
): Promise<ProductMediaUploadResponse> {
  return catalogService.createProductMediaUpload(link, metadata);
}

async function uploadDraft(
  item: ProductMediaFormItem,
  createUploadLink: HateoasLink,
  onItemStatus?: ProductMediaItemStatusHandler,
): Promise<string> {
  const file = item.file;
  if (!file) {
    throw new Error("Missing file for media upload");
  }

  onItemStatus?.(item.id, "uploading");
  let lastError: unknown;

  for (let attempt = 0; attempt < PRODUCT_MEDIA_UPLOAD_ATTEMPTS; attempt++) {
    try {
      const upload = await authorizeStagedUpload(createUploadLink, {
        filename: item.name ?? file.name,
        contentType: item.contentType,
        sizeBytes: item.sizeBytes ?? file.size,
      });
      await putPresignedObject(
        upload.url,
        file,
        upload.requiredHeaders ?? {},
        upload.method,
      );
      onItemStatus?.(item.id, "done");
      return upload.storageKey;
    } catch (error) {
      lastError = error;
    }
  }

  const message = uploadErrorMessage(lastError);
  onItemStatus?.(item.id, "error", message);
  throw lastError instanceof Error ? lastError : new Error(message);
}

function replacePayload(items: ProductMediaFormItem[]): ReplaceProductMediaRequest["medias"] {
  return sortedByRank(items).map((item) => {
    if (!item.storageKey) {
      throw new Error("Missing storage key for product media");
    }

    return {
      ...(item.file ? {} : { id: item.id }),
      storageKey: item.storageKey,
      contentType: item.contentType,
      rank: item.rank,
    };
  });
}

export async function stageProductMedia({
  items,
  createUploadLink,
  onItemStatus,
  onStaged,
}: StageProductMediaOptions): Promise<Map<string, string>> {
  const uploadedKeys = new Map<string, string>();
  const drafts = sortedByRank(items).filter((item) => item.file && !item.storageKey);

  for (const item of drafts) {
    const storageKey = await uploadDraft(item, createUploadLink, onItemStatus);
    uploadedKeys.set(item.id, storageKey);
    onStaged?.(item.id, storageKey);
  }

  return uploadedKeys;
}

export async function attachProductMedia({
  productId,
  items,
  seed = [],
  replaceMediaLink,
}: AttachProductMediaOptions): Promise<void> {
  if (!isGalleryDirty(items, seed)) return;

  await catalogService.replaceProductMedia(
    resolveUrlTemplate({ productId }, replaceMediaLink),
    { medias: replacePayload(items) },
  );
}
