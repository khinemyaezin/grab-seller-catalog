import type {
  ExtensionFieldErrors,
  SlotValidationErrors,
} from "@khinemyaezin/seller-contracts";

export interface FormattedErrorToast {
  message: string;
  description?: string;
}

function flattenErrors(
  errors: SlotValidationErrors | ExtensionFieldErrors,
): string[] {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(errors)) {
    if (typeof value === "string") {
      if (value) lines.push(value);
      continue;
    }
    const separator = key.indexOf("::");
    const groupId = separator >= 0 ? key.slice(0, separator) : key;
    for (const message of Object.values(value)) {
      if (typeof message !== "string" || !message) continue;
      lines.push(groupId ? `${groupId}: ${message}` : message);
    }
  }
  return lines;
}

export function formatExtensionErrorsForToast(
  errors?: SlotValidationErrors | ExtensionFieldErrors,
  fallbackMessage = "Validation failed. Please check the highlighted fields."
): FormattedErrorToast {
  if (!errors || Object.keys(errors).length === 0) {
    return { message: fallbackMessage };
  }

  const errorMessages = flattenErrors(errors);

  if (errorMessages.length === 0) {
    return { message: fallbackMessage };
  }

  if (errorMessages.length === 1) {
    return {
      message: "Validation Error",
      description: errorMessages[0],
    };
  }

  return {
    message: `Validation failed (${errorMessages.length} errors)`,
    description: errorMessages.map((msg) => `• ${msg}`).join("\n"),
  };
}
