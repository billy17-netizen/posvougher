/**
 * Format a number to Indonesian Rupiah currency format
 * @param amount The amount to format
 * @returns Formatted currency string
 */
export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format a date to Indonesian locale format
 * @param date The date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
};

/**
 * Format a date to simple date format (DD/MM/YYYY)
 * @param date The date to format
 * @returns Formatted date string in DD/MM/YYYY format
 */
export const formatSimpleDate = (date: Date): string => {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}; 