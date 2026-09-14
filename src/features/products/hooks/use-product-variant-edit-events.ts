import { useCallback, useState } from "react";
import { usePlatform } from "@khinemyaezin/seller-ui";
import type { ProductLifecycleEvent } from "@/features/products/types";
import { formatExtensionErrorsForToast } from "@/features/products/utils/error-formatter";

export type ProductVariantEditEventMessages = {
  updated?: string;
  updateFailed?: string;
  updateTimedOut?: string;
  deleted?: string;
  deleteFailed?: string;
  restored?: string;
  restoreFailed?: string;
};

export function useProductVariantEditEvents(messages?: ProductVariantEditEventMessages) {
  const platform = usePlatform();
  const [title, setTitle] = useState<string | undefined>();

  const toast = useCallback(
    (type: "success" | "error" | "info" | "warning", message: string, description?: string) => {
      platform?.events.emit("shell:toast:v1", {
        type,
        message,
        description,
        position: "top-center",
      });
    },
    [platform?.events],
  );

  const handleEvent = useCallback(
    (event: ProductLifecycleEvent) => {
      switch (event.type) {
        case "titleResolved":
          setTitle(event.title);
          break;
        case "updated":
          toast("success", messages?.updated ?? "Variant updated");
          break;
        case "updateFailed":
          toast("error", messages?.updateFailed ?? "Failed to update variant");
          break;
        case "updateTimedOut":
          toast("error", messages?.updateTimedOut ?? "Variant update is still running. Check back shortly.");
          break;
        case "validationFailed": {
          const { message, description } = formatExtensionErrorsForToast(
            event.errors,
            event.name ?? "Validation failed",
          );
          toast("error", message, description);
          break;
        }
        case "deleted":
          toast("success", messages?.deleted ?? "Variant deleted successfully");
          break;
        case "deleteFailed":
          toast(
            "error",
            messages?.deleteFailed ??
              (event.name ? `Failed to delete ${event.name}` : "Failed to delete variant"),
          );
          break;
        case "restored":
          toast("success", messages?.restored ?? "Variant restored successfully");
          break;
        case "restoreFailed":
          toast("error", messages?.restoreFailed ?? "Failed to restore variant");
          break;
        case "archived":
          toast("success", "Variant archived successfully");
          break;
        case "archiveFailed":
          toast("error", "Failed to archive variant");
          break;
        case "published":
          toast("success", "Variant published successfully");
          break;
        case "publishFailed":
          toast("error", event.name ?? "Failed to publish variant");
          break;
      }
    },
    [
      messages,
      toast,
    ],
  );

  return {
    title,
    handleEvent,
    toast,
  };
}
