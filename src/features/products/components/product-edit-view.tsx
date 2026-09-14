import { Link } from "react-router";
import { Header } from "@khinemyaezin/seller-ui/layout/header";
import { Button } from "@khinemyaezin/seller-ui/components/button";
import { ButtonGroup } from "@khinemyaezin/seller-ui/components/button-group";
import { QueryState } from "@khinemyaezin/seller-ui/components/query-state";
import { ArrowLeftIcon } from "lucide-react";
import { useProductEdit } from "@/features/products/hooks/use-product-edit";
import ProductEditForm from "./product-edit-form";
import ProductActionsMenu from "./product-edit-actions";
import type { ProductLifecycleEvent } from "../types";

export type ProductEditViewProps = {
    productId: string;
    onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export default function ProductEditView({
    productId,
    onLifecycleEvent,
}: ProductEditViewProps) {
    const { isLoading, isError, seed, status, actions } = useProductEdit({
        productId,
    });

    return (
        <>
            <Header
                title="Edit Product"
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
                    <ProductEditForm
                        productId={productId}
                        seed={seed}
                        status={status}
                        actions={actions}
                        onLifecycleEvent={onLifecycleEvent}
                    />
                ) : null}
            </QueryState>
        </>
    );
}
