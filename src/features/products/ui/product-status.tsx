import { ApiError, HateoasLink } from "@khinemyaezin/seller-api";
import { Button } from "@khinemyaezin/seller-ui/components/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@khinemyaezin/seller-ui/components/card";
import { Badge, ButtonStatus } from "@khinemyaezin/seller-ui/components/index";
import { useProductPublishMutation } from "@/features/products/api/use-products";
import { ProductLifecycleEvent } from "@/features/products/types";


export function formatProductStatus(status: string): string {
    return status
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getProductStatusDescription(status: string): string {
    switch (status) {
        case "DRAFT":
            return "This product is hidden from all sales channels.";
        case "ACTIVE":
            return "This product is visible to customers.";
        case "ARCHIVED":
            return "This product is archived and hidden from customers.";
        case "SUSPENDED":
            return "This product is suspended and hidden from customers.";
        default:
            return "Review this product's current publishing status.";
    }
}

export function getProductStatusBadgeClass(status: string): "success" | "warning" | "destructive" | "default" {
    switch (status) {
        case "ACTIVE":
            return "success";
        case "DRAFT":
            return "warning";
        case "ARCHIVED":
        case "SUSPENDED":
            return "destructive";
        default:
            return "default";
    }
}

export interface ProductStatusSelectProps {
    status: string | undefined;
    link?: HateoasLink,
    onLifecycleEvent?: (event: ProductLifecycleEvent) => void;
}

export function ProductStatus({ status, link, onLifecycleEvent }: ProductStatusSelectProps) {
    const productStatus = (status ?? "").toUpperCase();
    const publishProductMutation = useProductPublishMutation();

    const handleOnPublish = () => {
        if (!link) return;
        publishProductMutation.mutate(
            { link: link },
            {
                onSuccess: () => {
                    onLifecycleEvent?.({ type: "published", name: "" })
                },
                onError: (error) => {
                    const message = error instanceof ApiError ? (error?.data as { detail?: string })?.detail : undefined;
                    onLifecycleEvent?.({ type: "publishFailed", name: message })
                }
            }
        );
    }
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <CardTitle>Status</CardTitle>
                    <Badge >
                        {formatProductStatus(productStatus)}
                    </Badge>
                </div>
                <CardDescription>{getProductStatusDescription(productStatus)}</CardDescription>
            </CardHeader>

            {productStatus === "DRAFT" && (
                <CardContent>
                    <Button type="button" className="w-full" onClick={handleOnPublish} disabled={publishProductMutation.isPending || publishProductMutation.isSuccess}>
                        <ButtonStatus status={
                            publishProductMutation.isPending
                                ? "pending"
                                : publishProductMutation.isSuccess
                                    ? "success"
                                    : "idle"
                        }
                            pendingLabel="Publishing..."
                            successLabel="Published">
                            Publish
                        </ButtonStatus>
                    </Button>
                </CardContent>

            )}
            {productStatus === "ACTIVE" && (
                <CardContent>
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <p className="font-medium">Published</p>
                        <p className="mt-1 text-emerald-700 dark:text-emerald-400">
                            Customers can view this product in your sales channels.
                        </p>
                    </div>
                </CardContent>
            )}
        </Card>
    )
}
