import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Header } from "@khinemyaezin/seller-ui/layout/header";
import { SlotProvider, usePlatform } from "@khinemyaezin/seller-ui";
import { QueryState } from "@khinemyaezin/seller-ui/components/query-state";
import ProductNewForm from "./product-new-form";
import { useRoot } from "@/features/products/api/use-root";
import { useProductCreateEvents } from "./use-product-create-events";
import { Button } from "@khinemyaezin/seller-ui/components/button";
import { ButtonGroup } from "@khinemyaezin/seller-ui/components/button-group";
import { Card, CardContent } from "@khinemyaezin/seller-ui/components/card";
import { ArrowLeftIcon } from "lucide-react";

export type ProductCreatePageProps = {};

export default function NewProductPage({ }: ProductCreatePageProps) {
  const platform = usePlatform();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useRoot();
  const createSellableProductLink = data?.createSellableProduct;
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
    <div className="container mx-auto max-w-2xl lg:max-w-5xl p-6">
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
      <QueryState
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load catalog."
      >
        {createSellableProductLink ? (
          <SlotProvider>
            <ProductNewForm
              link={createSellableProductLink}
              onLifecycleEvent={handleEvent}
            />
          </SlotProvider>
        ) : (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Product creation is not available.
              </p>
            </CardContent>
          </Card>
        )}
      </QueryState>
    </div>
  );
}
