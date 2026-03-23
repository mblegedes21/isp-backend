export const formatQuantityWithUnit = (quantity: number | null | undefined, unit?: string | null) => {
  const safeQuantity = Number.isFinite(Number(quantity)) ? Number(quantity) : 0;
  const safeUnit = (unit ?? "").trim() || "-";

  return `${safeQuantity} ${safeUnit}`;
};
