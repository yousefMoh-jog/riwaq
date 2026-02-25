/**
 * Format a number or string as Libyan Dinar (LYD) with Arabic-Indic digits
 * @param amount - The amount to format (number or string)
 * @returns Formatted string like "١٥٠ د.ل" or "١٢٬٥٠٠ د.ل"
 * 
 * @example
 * formatLYD(150) // "١٥٠ د.ل"
 * formatLYD("150.50") // "١٥٠٫٥ د.ل"
 * formatLYD(12500) // "١٢٬٥٠٠ د.ل"
 */
export function formatLYD(amount: number | string): string {
    // Convert string to number if needed
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Handle invalid numbers
    if (isNaN(numericAmount)) {
        return '٠ د.ل';
    }

    // Format with Arabic-Indic digits using ar-LY locale
    const formatted = new Intl.NumberFormat('ar-LY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(numericAmount);

    return `${formatted} د.ل`;
}

/**
 * Format any number with Arabic-Indic digits (for counts, stats, etc.)
 * @param value - The number to format
 * @returns Formatted string like "١٢٬٣٤٥"
 * 
 * @example
 * formatArabicNumber(1234) // "١٬٢٣٤"
 * formatArabicNumber("5000") // "٥٬٠٠٠"
 */
export function formatArabicNumber(value: number | string): string {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numericValue)) {
        return '٠';
    }

    return new Intl.NumberFormat('ar-LY').format(numericValue);
}
