/**
 * Centralized API URL Configuration for Inventory Management & Invoice Registration.
 * Reads non-NEXT_PUBLIC environment variables (BACKEND_URL, API_URL, SERVER_URL)
 * mapped via next.config.ts and automatically normalizes endpoints.
 */

function getRawBaseUrl(): string {
  if (typeof process === "undefined" || !process.env) {
    return "";
  }

  const raw =
    process.env.BACKEND_URL ||
    process.env.API_URL ||
    process.env.SERVER_URL ||
    process.env.APP_API_URL ||
    "";

  return raw.trim().replace(/\/+$/, "");
}

/**
 * Returns the normalized full base URL for Inventory API endpoints.
 * Always ends with `/api/inventory`.
 */
export function getInventoryApiUrl(): string {
  const raw = getRawBaseUrl();
  if (!raw) {
    return "http://localhost:5000/api/inventory";
  }

  if (raw.endsWith("/api/inventory")) {
    return raw;
  }
  if (raw.endsWith("/api")) {
    return `${raw}/inventory`;
  }
  if (raw.endsWith("/inventory")) {
    return raw.replace(/\/inventory$/, "/api/inventory");
  }

  return `${raw}/api/inventory`;
}

/**
 * Returns the normalized full base URL for Invoice Registration API endpoints.
 * Always ends with `/api/invoice-registration`.
 */
export function getInvoiceApiUrl(): string {
  const override = process.env.INVOICE_API_URL?.trim().replace(/\/+$/, "");
  if (override) {
    if (override.endsWith("/api/invoice-registration")) return override;
    if (override.endsWith("/api")) return `${override}/invoice-registration`;
    if (override.endsWith("/invoice-registration")) {
      return override.replace(/\/invoice-registration$/, "/api/invoice-registration");
    }
    return `${override}/api/invoice-registration`;
  }

  const raw = getRawBaseUrl();
  if (!raw) {
    return "http://localhost:5000/api/invoice-registration";
  }

  const root = raw
    .replace(/\/api\/inventory$/, "")
    .replace(/\/inventory$/, "")
    .replace(/\/api$/, "");

  return `${root}/api/invoice-registration`;
}

export const INVENTORY_API_BASE = getInventoryApiUrl();
export const INVOICE_API_BASE = getInvoiceApiUrl();
