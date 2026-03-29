import { escapeHTML } from '../utils';

export interface InputOptions {
  id: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  label: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  autocomplete?: string;
  disabled?: boolean;
  className?: string;
}

export interface ButtonOptions {
  id?: string;
  type?: 'button' | 'submit' | 'reset';
  text: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
  icon?: string; // Optional SVG string
}

/**
 * Generates the HTML string for a standard form input group (label + input).
 * Uses the design system classes defined in style.css.
 */
export function renderInput(options: InputOptions): string {
  const {
    id,
    name = id,
    type = 'text',
    label,
    placeholder = '',
    required = false,
    value = '',
    autocomplete,
    disabled = false,
    className = '',
  } = options;

  const requiredAttr = required ? 'required' : '';
  const disabledAttr = disabled ? 'disabled' : '';
  const autocompleteAttr = autocomplete ? `autocomplete="${escapeHTML(autocomplete)}"` : '';
  const valueAttr = value ? `value="${escapeHTML(value)}"` : '';

  return `
    <div class="mb-4 ${className}">
      <label for="${escapeHTML(id)}" class="label-text">
        ${escapeHTML(label)} ${required ? '<span class="text-red-500" aria-hidden="true">*</span>' : ''}
      </label>
      <input
        id="${escapeHTML(id)}"
        name="${escapeHTML(name)}"
        type="${escapeHTML(type)}"
        placeholder="${escapeHTML(placeholder)}"
        class="input-field"
        ${requiredAttr}
        ${disabledAttr}
        ${autocompleteAttr}
        ${valueAttr}
      />
    </div>
  `;
}

/**
 * Generates the HTML string for a standard button.
 * Uses the design system classes defined in style.css.
 */
export function renderButton(options: ButtonOptions): string {
  const {
    id,
    type = 'button',
    text,
    variant = 'primary',
    disabled = false,
    className = '',
    icon = '',
  } = options;

  const idAttr = id ? `id="${escapeHTML(id)}"` : '';
  const disabledAttr = disabled ? 'disabled' : '';
  const variantClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';

  return `
    <button
      ${idAttr}
      type="${escapeHTML(type)}"
      class="${variantClass} ${className}"
      ${disabledAttr}
    >
      ${icon ? `<span class="mr-2 flex items-center">${icon}</span>` : ''}
      ${escapeHTML(text)}
    </button>
  `;
}

/**
 * Generates the HTML string for an SVG loading spinner.
 * Useful for injecting into buttons or loading overlays.
 */
export function renderSpinner(className: string = 'w-5 h-5'): string {
  return `
    <svg class="animate-spin text-current inline-block ${className}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  `;
}

/**
 * Generates the HTML string for a card container.
 * Uses the .card class from style.css.
 */
export function renderCard(children: string, className: string = ''): string {
  return `
    <div class="card ${className}">
      ${children}
    </div>
  `;
}

/**
 * Generates the HTML string for a simple divider with optional text in the middle.
 */
export function renderDivider(text?: string): string {
  if (!text) {
    return `<hr class="my-6 border-t border-[var(--color-border)]" />`;
  }

  return `
    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center" aria-hidden="true">
        <div class="w-full border-t border-[var(--color-border)]"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-[var(--color-bg-card)] text-[var(--color-text-muted)]">
          ${escapeHTML(text)}
        </span>
      </div>
    </div>
  `;
}

/**
 * Generates the HTML string for an alert/error message box.
 */
export function renderAlert(message: string, type: 'error' | 'success' | 'info' = 'error'): string {
  let bgClass = '';
  let textClass = '';
  let borderClass = '';
  let icon = '';

  switch (type) {
    case 'error':
      bgClass = 'bg-[var(--color-error-bg)]';
      textClass = 'text-[var(--color-error-text)]';
      borderClass = 'border-[var(--color-error)]';
      icon = `<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
      break;
    case 'success':
      bgClass = 'bg-[var(--color-success-bg)]';
      textClass = 'text-[var(--color-success-text)]';
      borderClass = 'border-[var(--color-success)]';
      icon = `<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
      break;
    case 'info':
    default:
      bgClass = 'bg-[var(--color-bg)]';
      textClass = 'text-[var(--color-text)]';
      borderClass = 'border-[var(--color-border)]';
      icon = `<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
      break;
  }

  return `
    <div class="rounded-md border p-4 mb-4 flex items-start ${bgClass} ${textClass} ${borderClass}" role="alert">
      ${icon}
      <div class="text-sm font-medium">
        ${escapeHTML(message)}
      </div>
    </div>
  `;
}