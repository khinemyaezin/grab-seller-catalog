import { useParams } from "react-router";
import { SlotProvider, useShellBreadcrumb } from "@khinemyaezin/seller-ui";
import { useCatalogLink } from "@/features/products/hooks/use-root";
import ProductEditView from "@/features/products/components/product-edit-view";
import { useProductEditEvents } from "@/features/products/hooks/use-product-edit-events";

export default function EditProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const canEdit = !!useCatalogLink("getProduct");
  const { title, handleEvent } = useProductEditEvents();
  useShellBreadcrumb(title);

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <SlotProvider>
        {canEdit && productId && (
          <ProductEditView productId={productId} onLifecycleEvent={handleEvent} />
        )}
      </SlotProvider>
    </div>
  );
}
