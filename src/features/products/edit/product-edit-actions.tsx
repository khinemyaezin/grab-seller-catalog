import { HateoasLink, resolveLink } from "@khinemyaezin/seller-api";
import { useProductDeleteMutation, useProductPublishMutation, useProductRestoreMutation, useProductSuspendMutation } from "@/features/products/api/use-products";
import { ProductLifecycleEvent } from "@/features/products/types";
import { Archive, CircleCheck, CirclePause, Ellipsis, RotateCcw } from "lucide-react";
import { Button } from "@khinemyaezin/seller-ui/components/index";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@khinemyaezin/seller-ui/components/dropdown-menu";

export type ProductActionsMenuProps = {
    links?: Record<string, HateoasLink>;
    onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
}

export default function ProductActionsMenu({ links, onLifecycleEvent }: ProductActionsMenuProps) {
    const productDeleteLink = resolveLink(links, "delete-product");
    const productRestoreLink = resolveLink(links, "restore-product");
    const publishProductLink = resolveLink(links, "publish-product");
    const suspendProductLink = resolveLink(links, "suspend-product")

    const deleteProductMutation = useProductDeleteMutation();
    const restoreProductMutation = useProductRestoreMutation();
    const publishProductMutation = useProductPublishMutation();
    const suspendProductMutation = useProductSuspendMutation();

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

    function handleOnPublish() {
        if (!publishProductLink) return;
        publishProductMutation.mutate(
            { link: publishProductLink },
            {
                onSuccess: () => { onLifecycleEvent?.({ type: "published" }); publishProductMutation.reset() },
                onError: () => { onLifecycleEvent?.({ type: "publishedFailed" }); publishProductMutation.reset() },
            },
        );
    }

    function handleOnSuspend() {
        if (!suspendProductLink) return;
        suspendProductMutation.mutate(
            { link: suspendProductLink },
            {
                onSuccess: () => { onLifecycleEvent?.({ type: "suspend" }); publishProductMutation.reset() },
                onError: () => { onLifecycleEvent?.({ type: "suspendedFailed" }); publishProductMutation.reset() },
            },
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="secondary">
                    <Ellipsis />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuGroup>
                    {publishProductLink && (
                        <DropdownMenuItem
                            disabled={publishProductMutation.isPending}
                            onClick={handleOnPublish}>
                            <CircleCheck />
                            Publish
                        </DropdownMenuItem>
                    )}
                    {suspendProductLink && (
                        <DropdownMenuItem
                            disabled={suspendProductMutation.isPending}
                            onClick={handleOnSuspend}>
                            <CirclePause />
                            Suspend
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
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
