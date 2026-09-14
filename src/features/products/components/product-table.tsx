
import { Link } from "react-router";
import { useCallback, useMemo } from "react";
import { useProductSearch, useProductDeleteMutation, useProductRestoreMutation } from "@/features/products/hooks/use-products";
import { HateoasLink } from "@khinemyaezin/seller-api";
import { ProductFilterFormValue, ProductLifecycleEvent, ProductSearchResponse } from "@/features/products/types";
import { Pager } from "@khinemyaezin/seller-ui/components/pager";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@khinemyaezin/seller-ui/components/table";
import { Badge, Button } from "@khinemyaezin/seller-ui/components/index";
import { DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenu } from "@khinemyaezin/seller-ui/components/dropdown-menu";
import { hasLink, resolveLink } from "@khinemyaezin/seller-api";
import { Ellipsis, ImageIcon } from "lucide-react";
import { formatProductStatus, getProductStatusBadgeClass } from "./product-status";

type FeatureProduct = {
  productId: string;
  name: string;
  status: string;
  slug: string;
  categoryName: string;
  _links?: Record<string, HateoasLink>;
};

export type ProductTableProps = {
  link: HateoasLink;
  filter: ProductFilterFormValue;
  onPageChange?: (page: number) => void;
  onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
};

function transformToProducts(data?: ProductSearchResponse): FeatureProduct[] {
  return data?._embedded?.productSearchResponseList?.map((product) => ({
    productId: product.productId,
    name: product.productName,
    status: product.status,
    slug: product.slug,
    categoryName: product.categoryName,
    _links: product._links
  })) ?? [];
}

export default function ProductTable({ link, filter, onPageChange, onLifecycleEvent }: ProductTableProps) {
  const { data } = useProductSearch(link, filter);
  const deleteProductMutation = useProductDeleteMutation();
  const restoreProductMutation = useProductRestoreMutation();
  const products = useMemo(() => transformToProducts(data), [data]);

  const handleArchive = useCallback(
    (deleteLink: HateoasLink, name: string) => {
      deleteProductMutation.mutate(
        { link: deleteLink },
        {
          onSuccess: () => onLifecycleEvent?.({ type: "archived", name }),
          onError: () => onLifecycleEvent?.({ type: "archiveFailed", name }),
        },
      );
    },
    [deleteProductMutation, onLifecycleEvent],
  );

  const handleOnRestore = useCallback(
    (link: HateoasLink) => {
      restoreProductMutation.mutate(
        { link: link },
        {
          onSuccess: () => onLifecycleEvent?.({ type: "restored" }),
          onError: () => onLifecycleEvent?.({ type: "restoreFailed" }),
        },
      );
    },
    [restoreProductMutation, onLifecycleEvent],
  );

  const showPagination = (data?.page.totalPages ?? 0) > 1;

  if (products.length == 0) {
    return <NoProduct />
  }

  return (
    <Table className="[&_tr>*:first-child]:pl-(--card-spacing) [&_tr>*:last-child]:pr-(--card-spacing)">
      <TableHeader>
        <TableRow className="bg-muted">
          <TableHead className="w-[48px]"></TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Status</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody >
        {
          products.map((product) => (
            <TableRow key={product.productId}>
              <TableCell>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              </TableCell>
              <TableCell className="grid grid-rows-2 gap-1">
                <Link
                  to={product.productId}
                  className="font-medium hover:underline"
                >
                  {product.name}
                </Link>
                <span className="font-normal text-muted-foreground">{product.categoryName}</span>
              </TableCell>
              <TableCell>
                <Badge variant="default">
                  {formatProductStatus(product.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                      <Ellipsis />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuGroup>
                      {resolveLink(product._links, "delete-product") && (
                        <DropdownMenuItem variant="destructive"
                          disabled={deleteProductMutation.isPending}
                          onClick={() => handleArchive(resolveLink(product._links, "delete-product")!, product.name)}>
                          Archive
                        </DropdownMenuItem>
                      )}

                      {hasLink(product._links, "restore-product") && (
                        <DropdownMenuItem
                          disabled={restoreProductMutation.isPending}
                          onClick={() => handleOnRestore(resolveLink(product._links, "restore-product")!)}>
                          Restore
                        </DropdownMenuItem>
                      )}

                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        }
      </TableBody>
      {showPagination && (
        <TableFooter className="bg-transparent">
          <TableRow>
            <TableCell colSpan={4} className="px-(--card-spacing)">
              <div className="flex w-full items-center justify-between py-3">
                <span className="text-muted-foreground grow">
                  Showing {data?.page ? data.page.number * data.page.size + 1 : 0} - {data?.page ? data.page.number * data.page.size + products.length : 0} of {data?.page?.totalElements} products
                </span>
                {data?.page && (
                  <Pager
                    className="justify-end"
                    onPageChange={onPageChange}
                    {...data?.page}
                  />
                )}
              </div>

            </TableCell>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}

function NoProduct() {
  return (
    <div className="flex flex-col items-center justify-center gap-1 text-center">
      <p className="text-base font-semibold text-foreground">No products found</p>
      <p className="text-sm text-muted-foreground">
        Try changing the filters or search term
      </p>
    </div>
  );
}

