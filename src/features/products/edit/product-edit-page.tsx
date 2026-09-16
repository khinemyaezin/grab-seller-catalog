import { useParams } from "react-router";
import { SlotProvider, useShellBreadcrumb } from "@khinemyaezin/seller-ui";
import { QueryState } from "@khinemyaezin/seller-ui/components/query-state";
import { Card, CardContent } from "@khinemyaezin/seller-ui/components/card";
import { useRoot } from "@/features/products/api/use-root";
import ProductEditView from "./product-edit-view";
import { useProductEditEvents } from "./use-product-edit-events";

export default function EditProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const { data, isLoading, isError } = useRoot();
  const canEdit = !!data?.getProduct;
  const { title, handleEvent } = useProductEditEvents();
  useShellBreadcrumb(title);

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <QueryState
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load catalog."
      >
        {canEdit && productId ? (
          <SlotProvider>
            <ProductEditView productId={productId} onLifecycleEvent={handleEvent} />
          </SlotProvider>
        ) : (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This product cannot be edited.
              </p>
            </CardContent>
          </Card>
        )}
      </QueryState>
    </div>
  );
}
