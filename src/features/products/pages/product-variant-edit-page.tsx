import { Link, useParams } from "react-router";
import { Header } from "@khinemyaezin/seller-ui/layout/header";
import { SlotProvider, useShellBreadcrumb } from "@khinemyaezin/seller-ui";
import { useCatalogLink } from "@/features/products/hooks/use-root";
import { useProductEditEvents } from "@/features/products/hooks/use-product-edit-events";
import { Button } from "@khinemyaezin/seller-ui/components/button";
import { ButtonGroup } from "@khinemyaezin/seller-ui/components/button-group";
import { ArrowLeftIcon } from "lucide-react";
import ProductVariantEditView from "../components/product-variant-edit-view";

export default function ProductVariantEditPage() {
  const { productId, variantId } = useParams<{ productId: string; variantId: string }>();
  const canEdit = !!useCatalogLink("getProduct");
  const { title, handleEvent } = useProductEditEvents();
  useShellBreadcrumb(title);

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <Header
        title={title ? `Edit ${title}` : "Edit Variant"}
        description="Update variant details, pricing, and inventory."
      >
        <ButtonGroup>
          <Button type="button" variant="secondary" asChild>
            <Link to="../.." relative="path" className="flex gap-2 items-center">
              <ArrowLeftIcon />
            </Link>
          </Button>
        </ButtonGroup>
      </Header>
      <SlotProvider>
          {canEdit && (
            <ProductVariantEditView
              productId={productId!}
              variantId={variantId!}
              onLifecycleEvent={handleEvent}
            />
          )}
      </SlotProvider>
    </div>
  );
}
