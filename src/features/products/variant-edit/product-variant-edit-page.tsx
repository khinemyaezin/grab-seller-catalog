import { useParams } from "react-router";
import { SlotProvider, useShellBreadcrumb, useShellBreadcrumbSegment } from "@khinemyaezin/seller-ui";
import { useProductVariantEditEvents } from "./use-product-variant-edit-events";
import ProductVariantEditView from "./product-variant-edit-view";

export default function ProductVariantEditPage() {
  const { productId, variantId } = useParams<{ productId: string; variantId: string }>();
  const { title, productTitle, handleEvent } = useProductVariantEditEvents();
  useShellBreadcrumbSegment(":productId", productTitle);
  useShellBreadcrumb(title);

  return (
    <div className="container mx-auto max-w-5xl p-6">
      {productId && variantId ? (
        <SlotProvider>
          <ProductVariantEditView
            productId={productId}
            variantId={variantId}
            onLifecycleEvent={handleEvent}
          />
        </SlotProvider>
      ) : null}
    </div>
  );
}
