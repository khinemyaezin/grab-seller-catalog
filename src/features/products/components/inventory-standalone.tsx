import { STANDALONE_INVENTORY_GROUP_ID } from "../constants/inventory-group-id";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@khinemyaezin/seller-ui/components/card";
import { InventoryLineFullSlot } from "./inventory-full-slot";
import { ProductFormValue } from "../types";
import { useFormContext, useWatch } from "react-hook-form";
import { ManageInventoryField, tracksInventory } from "./manage-inventory-field";

export function InventoryStandalone() {
    const { control } = useFormContext<ProductFormValue>();
    const isStandalone = useWatch({
        control,
        name: "variationTypes",
        compute: (value) => value.length == 0
    })
    const sku = useWatch({
        control,
        name: "product.standaloneVariant.sku",
        defaultValue: "",
    });
    const manageInventory = useWatch({
        control,
        name: "product.standaloneVariant.manageInventory",
        defaultValue: true,
    });

    if (!isStandalone) return;
    return (
        <Card>
            <CardHeader>
                <CardTitle>Inventory</CardTitle>
                <CardDescription>
                    Set initial stock and safety stock for each location.
                </CardDescription>
                <CardAction>
                    <ManageInventoryField name="product.standaloneVariant.manageInventory" />
                </CardAction>
            </CardHeader>
            {tracksInventory(manageInventory) && (
               <CardContent>
                 <InventoryLineFullSlot
                    groupId={STANDALONE_INVENTORY_GROUP_ID}
                    context={{ sku: sku ?? "" }}
                />
               </CardContent>
            )}

        </Card>
    )
}
