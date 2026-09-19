import { Card, CardContent, CardHeader, CardTitle } from "@khinemyaezin/seller-ui/components/card";
import { NativeSelect, NativeSelectOption } from "@khinemyaezin/seller-ui/components/native-select";
import { useFormContext } from "react-hook-form";
import type { ProductFormValue, ProductStatus as ProductStatusValue } from "@/features/products/types";

const SELECTABLE_STATUSES: ProductStatusValue[] = ["DRAFT", "ACTIVE"];

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

function isLockedStatus(status: string): status is "ARCHIVED" | "SUSPENDED" {
    return status === "ARCHIVED" || status === "SUSPENDED";
}

export function ProductStatus() {
    const { register, watch } = useFormContext<ProductFormValue>();
    const status = (watch("product.status") ?? "DRAFT").toUpperCase();
    const locked = isLockedStatus(status);
    const cannotDraft = status === "ACTIVE";
    const options: ProductStatusValue[] = locked
        ? [status]
        : SELECTABLE_STATUSES;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
                <NativeSelect
                    className="w-full"
                    aria-label="Status"
                    disabled={locked}
                    {...register("product.status")}
                >
                    {options.map((value) => (
                        <NativeSelectOption
                            key={value}
                            value={value}
                            disabled={value === "DRAFT" && cannotDraft}
                        >
                            {formatProductStatus(value)}
                        </NativeSelectOption>
                    ))}
                </NativeSelect>
            </CardContent>
        </Card>
    );
}
