
import { Header } from "@khinemyaezin/seller-ui/layout/header";
import { usePlatform } from "@khinemyaezin/seller-ui";
import { useRoot } from "@/features/products/api/use-root";
import ProductsView from "./products-view";
import type { ProductLifecycleEvent } from "@/features/products/types";

export default function AdminProductsPage() {
  const { data: catalogRoot } = useRoot();
  const platform = usePlatform();

  const toast = (type: "success" | "error", message: string) =>
    platform?.events.emit("shell:toast:v1", { type, message, position: "top-center" });

  const handleEvent = (event: ProductLifecycleEvent) => {
    switch (event.type) {
      case "archived": toast("success", `${event.name} archived`); break;
      case "archiveFailed": toast("error", `Failed to archive ${event.name}`); break;
      case "restored": toast("success", "Product restored successfully"); break;
      case "restoreFailed": toast("error", "Failed to restore product"); break;
    }
  };

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <Header
        title="Products"
        description="Manage your product catalog, update stock status, and add new inventory.">
      </Header>

      {catalogRoot?.searchProducts && (
        <ProductsView
          link={catalogRoot.searchProducts}
          canCreate={!!catalogRoot.createProduct}
          onLifecycleEvent={handleEvent}
        />
      )}
    </div>
  );
}
