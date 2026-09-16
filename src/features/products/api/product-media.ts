import {
  DEFAULT_MEDIA_UPLOAD_ATTEMPTS,
  resolveUrlTemplate,
  stageMediaDrafts,
  type HateoasLink,
} from "@khinemyaezin/seller-api";
import {
  formatMediaReplacements,
  isMediaGalleryDirty,
  type MediaGalleryItemStatus,
} from "@khinemyaezin/seller-ui/components/media-gallery";
import { catalogService } from "@/features/products/api/catalog";
import { putPresignedObject } from "@/features/products/api/storage";
import type {
  CreateProductMediaUploadRequest,
  ProductMediaFormItem,
  ProductMediaUploadResponse,
  ReplaceProductMediaRequest,
} from "@/features/products/types";

export const PRODUCT_MEDIA_UPLOAD_ATTEMPTS = DEFAULT_MEDIA_UPLOAD_ATTEMPTS;

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

export { isMediaGalleryDirty as isGalleryDirty };

export function authorizeStagedUpload(
  link: HateoasLink,
  metadata: CreateProductMediaUploadRequest,
): Promise<ProductMediaUploadResponse> {
  return catalogService.createProductMediaUpload(link, metadata);
}

function replacePayload(items: ProductMediaFormItem[]): ReplaceProductMediaRequest["medias"] {
  return formatMediaReplacements(items);
}

export async function stageProductMedia({
  items,
  createUploadLink,
  onItemStatus,
  onStaged,
}: StageProductMediaOptions): Promise<Map<string, string>> {
  return stageMediaDrafts({
    items,
    authorizer: (metadata) => authorizeStagedUpload(createUploadLink, metadata),
    uploader: putPresignedObject,
    maxAttempts: PRODUCT_MEDIA_UPLOAD_ATTEMPTS,
    onItemStatus,
    onStaged,
  });
}

export async function attachProductMedia({
  productId,
  items,
  seed = [],
  replaceMediaLink,
}: AttachProductMediaOptions): Promise<void> {
  if (!isMediaGalleryDirty(items, seed)) return;

  await catalogService.replaceProductMedia(
    resolveUrlTemplate({ productId }, replaceMediaLink),
    { medias: replacePayload(items) },
  );
}
