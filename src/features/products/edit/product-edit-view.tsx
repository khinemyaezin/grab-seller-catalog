import { Link } from "react-router";
import { Header } from "@khinemyaezin/seller-ui/layout/header";
import { Button } from "@khinemyaezin/seller-ui/components/button";
import { ButtonGroup } from "@khinemyaezin/seller-ui/components/button-group";
import { QueryState } from "@khinemyaezin/seller-ui/components/query-state";
import { ArrowLeftIcon } from "lucide-react";
import { useProductEdit } from "./use-product-edit";
import ProductEditForm from "./product-edit-form";
import ProductActionsMenu from "./product-edit-actions";
import type { ProductLifecycleEvent } from "@/features/products/types";
import { ProductPublicationPanel } from "../ui/product-publication-panel";

export type ProductEditViewProps = {
    productId: string;
    onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export default function ProductEditView({
    productId,
    onLifecycleEvent,
}: ProductEditViewProps) {
    const { isLoading, isError, seed, status, actions, publications } = useProductEdit({
        productId,
    });

    return (
        <>
            <Header
                title={`Edit ${seed?.product.name ?? " Product"}`}
                description="Update your product details."
            >
                <ButtonGroup>
                    <ButtonGroup>
                        <Button type="button" variant="secondary" asChild>
                            <Link to=".." className="flex gap-2 items-center">
                                <ArrowLeftIcon />
                            </Link>
                        </Button>
                    </ButtonGroup>
                    <ButtonGroup>
                        <ProductActionsMenu links={actions} onLifecycleEvent={onLifecycleEvent} />
                    </ButtonGroup>
                </ButtonGroup>
            </Header>
            <QueryState isLoading={isLoading || !seed} isError={isError && !seed}>
                {seed ? (
                    <div className="grid grid-cols-1 lg:has-[aside:not(:empty)]:grid-cols-5 gap-6 items-start">
                        <div className="w-full lg:has-[+aside:not(:empty)]:col-span-3">
                            <ProductEditForm
                                productId={productId}
                                seed={seed}
                                actions={actions}
                                onLifecycleEvent={onLifecycleEvent}
                            />
                        </div>
                        <aside className="empty:hidden lg:col-span-2 flex flex-col gap-6">
                            <ProductPublicationPanel
                                productId={productId}
                                publications={publications}
                                links={actions}
                            />
                        </aside>
                    </div>
                ) : null}
            </QueryState>
        </>
    );
}
