import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Header } from "@khinemyaezin/seller-ui/layout/header";
import { SlotProvider, usePlatform } from "@khinemyaezin/seller-ui";
import ProductNewForm from "@/features/products/components/product-new-form";
import { useCatalogLink } from "../hooks/use-root";
import { useProductCreateEvents } from "@/features/products/hooks/use-product-create-events";
import { Button } from "@khinemyaezin/seller-ui/components/button";
import { ButtonGroup } from "@khinemyaezin/seller-ui/components/button-group";
import { ArrowLeftIcon } from "lucide-react";

export type ProductCreatePageProps = {};

export default function NewProductPage({ }: ProductCreatePageProps) {
  const platform = usePlatform();
  const navigate = useNavigate();
  const createSellableProductLink = useCatalogLink("createSellableProduct");
  const { handleEvent } = useProductCreateEvents();

  useEffect(() => {
    if (!platform?.events) return;
    const unsubs = [
      platform.events.subscribe("form:discard:v1", () => {
        navigate("..");
      }),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [navigate, platform?.events]);

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Header
        title="Add Product"
        description="Add a new product to your seller catalog."
      >
        <ButtonGroup>
          <Button type="button" variant="secondary" asChild>
            <Link to=".." className="flex gap-2 items-center">
              <ArrowLeftIcon />
            </Link>
          </Button>
        </ButtonGroup>
      </Header>
      {createSellableProductLink && (
        <SlotProvider>
            <ProductNewForm
              link={createSellableProductLink}
              onLifecycleEvent={handleEvent}
              onCreated={(productId) => navigate(`../${productId}`)}
            />
        </SlotProvider>
      )}
    </div>
  );
}
