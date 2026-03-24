import { CartItem } from './types';

/**
 * Formats a number into a localized currency string.
 * @param amount The amount to format.
 * @param currency The currency code (default: 'USD').
 * @param locale The locale string (default: 'en-US').
 * @returns Formatted currency string.
 */
export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Calculates the total price of all items in the cart.
 * @param cart Array of CartItem objects.
 * @returns Total price.
 */
export function calculateCartTotal(cart: CartItem[]): number {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((total, item) => {
        // Ensure we handle potential missing properties gracefully
        const price = item?.product?.price || 0;
        const quantity = item?.quantity || 0;
        return total + (price * quantity);
    }, 0);
}

/**
 * Calculates the total number of items (quantity) in the cart.
 * @param cart Array of CartItem objects.
 * @returns Total item count.
 */
export function calculateCartItemsCount(cart: CartItem[]): number {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((count, item) => count + (item?.quantity || 0), 0);
}

/**
 * Safely retrieves and parses a value from localStorage.
 * @param key The localStorage key.
 * @param defaultValue The default value to return if the key doesn't exist or parsing fails.
 * @returns The parsed value or the default value.
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        return defaultValue;
    }
}

/**
 * Safely stringifies and saves a value to localStorage.
 * @param key The localStorage key.
 * @param value The value to save.
 */
export function setLocalStorage<T>(key: string, value: T): void {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
    }
}

/**
 * Creates a debounced function that delays invoking the provided function until after `wait` milliseconds.
 * @param func The function to debounce.
 * @param wait The number of milliseconds to delay.
 * @returns A new debounced function.
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    return function(...args: Parameters<T>) {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

/**
 * Generates a simple unique identifier.
 * Useful for temporary keys or UI elements.
 * @returns A random string ID.
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}