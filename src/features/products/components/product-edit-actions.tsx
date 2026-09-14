import { HateoasLink, resolveLink } from "@khinemyaezin/seller-api";
import { useProductDeleteMutation, useProductRestoreMutation } from "../hooks/use-products";
import { ProductLifecycleEvent } from "../types";
import { Archive, Ellipsis, RotateCcw } from "lucide-react";
import { Button } from "@khinemyaezin/seller-ui/components/index";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@khinemyaezin/seller-ui/components/dropdown-menu";

export type ProductActionsMenuProps = {
    links?: Record<string, HateoasLink>;
    onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
}

export default function ProductActionsMenu({ links, onLifecycleEvent }: ProductActionsMenuProps) {
    const productDeleteLink = resolveLink(links, "delete-product");
    const productRestoreLink = resolveLink(links, "restore-product");

    const deleteProductMutation = useProductDeleteMutation();
    const restoreProductMutation = useProductRestoreMutation();

    function handleArchive() {
        if (!productDeleteLink) return;
        deleteProductMutation.mutate(
            { link: productDeleteLink },
            {
                onSuccess: () => { onLifecycleEvent?.({ type: "archived" }); deleteProductMutation.reset() },
                onError: () => { onLifecycleEvent?.({ type: "archiveFailed" }); deleteProductMutation.reset() },
            },
        );
    }

    function handleOnRestore() {
        if (!productRestoreLink) return;
        restoreProductMutation.mutate(
            { link: productRestoreLink },
            {
                onSuccess: () => { onLifecycleEvent?.({ type: "restored" }); restoreProductMutation.reset() },
                onError: () => { onLifecycleEvent?.({ type: "restoreFailed" }); restoreProductMutation.reset() },
            },
        );
    }

    if (!productDeleteLink && !productRestoreLink) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="secondary">
                    <Ellipsis />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuGroup>
                    {productRestoreLink && (
                        <DropdownMenuItem
                            disabled={restoreProductMutation.isPending}
                            onClick={handleOnRestore}>
                            <RotateCcw />
                            Restore
                        </DropdownMenuItem>
                    )}
                    {productDeleteLink && (
                        <DropdownMenuItem
                            variant="destructive"
                            disabled={deleteProductMutation.isPending}
                            onClick={handleArchive}>
                            <Archive />
                            Archive
                        </DropdownMenuItem>
                    )}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
