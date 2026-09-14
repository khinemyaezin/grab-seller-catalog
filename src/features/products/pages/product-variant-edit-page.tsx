import { useParams } from "react-router";
import { SlotProvider, useShellBreadcrumb } from "@khinemyaezin/seller-ui";
import { useProductVariantEditEvents } from "@/features/products/hooks/use-product-variant-edit-events";
import ProductVariantEditView from "../components/product-variant-edit-view";

export default function ProductVariantEditPage() {
  const { productId, variantId } = useParams<{ productId: string; variantId: string }>();
  const { title, handleEvent } = useProductVariantEditEvents();
  useShellBreadcrumb(title);

  const hasParams = Boolean(productId && variantId);

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
