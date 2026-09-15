import { useCallback } from "react";
import { usePlatform } from "@khinemyaezin/seller-ui";
import type { ProductLifecycleEvent } from "@/features/products/types";
import { formatExtensionErrorsForToast } from "@/features/products/utils/error-formatter";

export function useProductCreateEvents() {
  const platform = usePlatform();

  const toast = useCallback(
    (
      type: "success" | "error" | "info" | "warning",
      message: string,
      description?: string,
    ) => {
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
        case "created":
          toast("success", "Product created");
          break;
        case "createMediaFailed":
          toast(
            "warning",
            "Product created, but images could not be saved. Add them from the product page.",
          );
          break;
        case "createFailed":
          toast("error", "Failed to create product. Check pricing and inventory.");
          break;
        case "createTimedOut":
          toast("info", "Product creation is still running. Check the product list shortly.");
          break;
        case "validationFailed": {
          const { message, description } = formatExtensionErrorsForToast(
            event.errors,
            event.name ?? "Validation failed",
          );
          toast("error", message, description);
          break;
        }
      }
    },
    [toast],
  );

  return {
    handleEvent,
    toast,
  };
}
