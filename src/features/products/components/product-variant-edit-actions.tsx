import { HateoasLink, resolveLink } from "@khinemyaezin/seller-api";
import { useProductVariantDeleteMutation, useProductVariantRestoreMutation } from "../hooks/use-products";
import { ProductLifecycleEvent } from "../types";
import { Ellipsis, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@khinemyaezin/seller-ui/components/index";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@khinemyaezin/seller-ui/components/dropdown-menu";

export type ProductVariantActionsMenuProps = {
  productId: string,
  links?: Record<string, HateoasLink>;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

export default function ProductVariantActionsMenu({
  productId,
  links,
  onLifecycleEvent,
}: ProductVariantActionsMenuProps) {
  const variantDeleteLink = resolveLink(links, "delete-variant");
  const variantRestoreLink = resolveLink(links, "restore-variant");

  const deleteVariantMutation = useProductVariantDeleteMutation();
  const restoreVariantMutation = useProductVariantRestoreMutation();

  function handleDelete() {
    if (!variantDeleteLink) return;
    deleteVariantMutation.mutate(
      { link: variantDeleteLink, productId },
      {
        onSuccess: () => {
          onLifecycleEvent?.({ type: "deleted" });
          deleteVariantMutation.reset();
        },
        onError: () => {
          onLifecycleEvent?.({ type: "deleteFailed" });
          deleteVariantMutation.reset();
        },
      },
    );
  }

  function handleOnRestore() {
    if (!variantRestoreLink) return;
    restoreVariantMutation.mutate(
      { link: variantRestoreLink },
      {
        onSuccess: () => {
          onLifecycleEvent?.({ type: "restored" });
          restoreVariantMutation.reset();
        },
        onError: () => {
          onLifecycleEvent?.({ type: "restoreFailed" });
          restoreVariantMutation.reset();
        },
      },
    );
  }

  if (!variantDeleteLink && !variantRestoreLink) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="secondary">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          {variantRestoreLink && (
            <DropdownMenuItem
              disabled={restoreVariantMutation.isPending}
              onClick={handleOnRestore}
            >
              <RotateCcw />
              Restore
            </DropdownMenuItem>
          )}
          {variantDeleteLink && (
            <DropdownMenuItem
              variant="destructive"
              disabled={deleteVariantMutation.isPending}
              onClick={handleDelete}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ProductVariantActionsMenu as ProductVariantEditActions };
export type { ProductVariantActionsMenuProps as ProductVariantEditActionsProps };
