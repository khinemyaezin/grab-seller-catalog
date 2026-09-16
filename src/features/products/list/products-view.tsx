
import { Link } from "react-router";
import { HateoasLink } from "@khinemyaezin/seller-api";
import { Button } from "@khinemyaezin/seller-ui/components/button";
import { Card, CardHeader } from "@khinemyaezin/seller-ui/components/card";
import ProductTable from "./product-table";
import ProductsFilter from "./products-filter";
import { useProductFilter } from "./use-product-filter";

import type { ProductLifecycleEvent } from "@/features/products/types";

export type ProductsViewProps = {
  link: HateoasLink;
  canCreate: boolean;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export default function ProductsView({ link, canCreate, onLifecycleEvent }: ProductsViewProps) {
  const { filter, updateCriteria, updatePage } = useProductFilter();

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:flex-1">
          <ProductsFilter onChange={updateCriteria} />
        </div>
        {canCreate && (
          <Button variant="outline" size="sm" asChild>
            <Link to="new">Add product</Link>
          </Button>
        )}
      </CardHeader>
      <ProductTable
        link={link}
        filter={filter}
        onPageChange={updatePage}
        onLifecycleEvent={onLifecycleEvent}
      />
    </Card>
  );
}
