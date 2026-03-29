import { ToastNotification } from './types';

/**
 * Safely queries an element from the DOM.
 * Returns null if the element is not found.
 */
export function getElement<T extends HTMLElement>(
  selector: string,
  parent: Document | HTMLElement = document
): T | null {
  return parent.querySelector<T>(selector);
}

/**
 * Queries an element from the DOM and throws an error if not found.
 * Useful for strict initialization where elements are guaranteed to exist.
 */
export function requireElement<T extends HTMLElement>(
  selector: string,
  parent: Document | HTMLElement = document
): T {
  const el = parent.querySelector<T>(selector);
  if (!el) {
    throw new Error(`Required DOM element not found: ${selector}`);
  }
  return el;
}

/**
 * Removes all child nodes from a given HTML element.
 */
export function clearChildren(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Validates an email address format using a standard regex.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a password based on minimum security requirements.
 * (e.g., at least 8 characters)
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Safely formats an unknown error object into a readable string message.
 * Specifically handles Appwrite/Network errors.
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    // Appwrite sometimes returns specific error messages we can pass directly
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Escapes HTML characters in a string to prevent XSS attacks
 * when rendering user input (like names or profile data) into the DOM.
 */
export function escapeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Toggles the loading state of a button, showing a spinner and disabling it.
 */
export function setButtonLoading(
  button: HTMLButtonElement,
  isLoading: boolean,
  originalText: string
): void {
  if (isLoading) {
    button.disabled = true;
    button.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Processing...
    `;
  } else {
    button.disabled = false;
    button.textContent = originalText;
  }
}

/**
 * Displays a toast notification on the screen.
 * Uses the CSS classes defined in src/style.css.
 */
export function showToast({ message, type, duration = 4000 }: ToastNotification): void {
  // Check for existing toasts to adjust positioning and prevent exact overlap
  const existingToasts = document.querySelectorAll('.toast');
  const offset = existingToasts.length * 60; // 60px offset per existing toast

  const toast = document.createElement('div');
  
  // Base classes from style.css
  toast.className = `toast toast-hidden toast-${type}`;
  
  // If it's an info toast (not explicitly styled in CSS), fallback to default styling
  if (type === 'info') {
    toast.style.backgroundColor = 'var(--color-bg-card)';
    toast.style.color = 'var(--color-text)';
    toast.style.border = '1px solid var(--color-border)';
  }

  // Adjust bottom position if there are multiple toasts
  if (offset > 0) {
    toast.style.bottom = `calc(1rem + ${offset}px)`;
  }

  // Add icon based on type
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
  } else {
    iconSvg = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <span>${escapeHTML(message)}</span>
  `;

  document.body.appendChild(toast);

  // Trigger reflow to ensure the transition works
  void toast.offsetWidth;

  // Animate in
  toast.classList.remove('toast-hidden');

  // Setup removal
  setTimeout(() => {
    toast.classList.add('toast-hidden');
    toast.addEventListener('transitionend', () => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    });
  }, duration);
}