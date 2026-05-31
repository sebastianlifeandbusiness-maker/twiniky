/**
 * Format a number as Chilean Peso (CLP).
 * e.g. 15990 → "$15.990"
 */
export function formatCLP(price: number | string): string {
  const n = Math.round(Number(price));
  return `$${n.toLocaleString("es-CL")}`;
}

/** Free shipping threshold in CLP */
export const FREE_SHIPPING_THRESHOLD = 50000;
/** Shipping cost in CLP when below threshold */
export const SHIPPING_COST = 3990;
