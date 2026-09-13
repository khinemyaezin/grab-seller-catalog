import { Link, useParams } from "react-router";
import { Header } from "@khinemyaezin/seller-ui/layout/header";
import { SlotProvider, useShellBreadcrumb } from "@khinemyaezin/seller-ui";
import { useCatalogLink } from "@/features/products/hooks/use-root";
import ProductEditForm from "@/features/products/components/product-edit-form";
import { useProductEditEvents } from "@/features/products/hooks/use-product-edit-events";
import { Button } from "@khinemyaezin/seller-ui/components/button";
import { ButtonGroup } from "@khinemyaezin/seller-ui/components/button-group";
import { ArrowLeftIcon } from "lucide-react";

export default function EditProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const canEdit = !!useCatalogLink("getProduct");
  const { title, handleEvent } = useProductEditEvents();
  useShellBreadcrumb(title);

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <Header
        title="Edit Product"
        description="Update your product details."
      >
        <ButtonGroup>
          <Button type="button" variant="secondary" asChild>
            <Link to=".." className="flex gap-2 items-center">
              <ArrowLeftIcon />
            </Link>
          </Button>
          </ButtonGroup>
      </Header>
      <SlotProvider>
          {canEdit && (
            <ProductEditForm productId={productId!} onLifecycleEvent={handleEvent} />
          )}
      </SlotProvider>
    </div>
  );
}
