import { NavigateFunction } from '../types';
import { 
  requireElement, 
  isValidEmail, 
  isValidPassword,
  formatError, 
  setButtonLoading, 
  showToast 
} from '../utils';
import { account, ID } from '../appwrite';
import { 
  renderInput, 
  renderButton, 
  renderCard, 
  renderAlert, 
  renderDivider 
} from './ui';

/**
 * Renders the registration form component and handles account creation logic.
 * 
 * @param container - The DOM element where the form will be mounted.
 * @param navigate - Function to trigger view changes (routing).
 * @param onRegisterSuccess - Callback function executed after successful registration and login.
 */
export function renderRegisterForm(
  container: HTMLElement,
  navigate: NavigateFunction,
  onRegisterSuccess: () => void
): void {
  // Build the form HTML using UI components
  const formContent = `
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold tracking-tight text-[var(--color-text)] mb-2">
        Create an account
      </h1>
      <p class="text-sm text-[var(--color-text-muted)]">
        Enter your details to get started
      </p>
    </div>

    <div id="register-error-container" class="hidden"></div>

    <form id="register-form" class="space-y-4" novalidate>
      ${renderInput({
        id: 'register-name',
        type: 'text',
        label: 'Full Name',
        placeholder: 'John Doe',
        required: true,
        autocomplete: 'name'
      })}

      ${renderInput({
        id: 'register-email',
        type: 'email',
        label: 'Email address',
        placeholder: 'name@example.com',
        required: true,
        autocomplete: 'email'
      })}

      ${renderInput({
        id: 'register-password',
        type: 'password',
        label: 'Password',
        placeholder: '••••••••',
        required: true,
        autocomplete: 'new-password'
      })}
      
      <p class="text-xs text-[var(--color-text-muted)] -mt-2 mb-4">
        Password must be at least 8 characters long.
      </p>

      <div class="pt-2">
        ${renderButton({
          id: 'register-submit-btn',
          type: 'submit',
          text: 'Create account',
          variant: 'primary',
          className: 'w-full'
        })}
      </div>
    </form>

    ${renderDivider('Already have an account?')}

    <div class="text-center text-sm">
      <span class="text-[var(--color-text-muted)]">Want to sign in instead?</span>
      <button 
        id="link-to-login" 
        class="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors focus:outline-none focus:underline ml-1"
      >
        Log in
      </button>
    </div>
  `;

  // Mount the card to the container
  container.innerHTML = `
    <div class="w-full max-w-md mx-auto animate-fade-in">
      ${renderCard(formContent)}
    </div>
  `;

  // Query DOM elements safely within the container
  const form = requireElement<HTMLFormElement>('#register-form', container);
  const nameInput = requireElement<HTMLInputElement>('#register-name', container);
  const emailInput = requireElement<HTMLInputElement>('#register-email', container);
  const passwordInput = requireElement<HTMLInputElement>('#register-password', container);
  const submitBtn = requireElement<HTMLButtonElement>('#register-submit-btn', container);
  const errorContainer = requireElement<HTMLDivElement>('#register-error-container', container);
  const loginLink = requireElement<HTMLButtonElement>('#link-to-login', container);

  // Helper to show/hide inline errors
  const showError = (message: string) => {
    errorContainer.innerHTML = renderAlert(message, 'error');
    errorContainer.classList.remove('hidden');
  };

  const hideError = () => {
    errorContainer.innerHTML = '';
    errorContainer.classList.add('hidden');
  };

  // Navigation Event
  loginLink.addEventListener('click', () => {
    navigate('login');
  });

  // Form Submission Event
  form.addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    hideError();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Basic Client-Side Validation
    if (!name || !email || !password) {
      showError('Please fill in all required fields.');
      return;
    }

    if (!isValidEmail(email)) {
      showError('Please enter a valid email address.');
      emailInput.focus();
      return;
    }

    if (!isValidPassword(password)) {
      showError('Password must be at least 8 characters long.');
      passwordInput.focus();
      return;
    }

    // Proceed with Registration
    try {
      setButtonLoading(submitBtn, true, 'Create account');
      
      // Appwrite SDK Call: Create a new user account
      // ID.unique() generates a unique identifier for the new user
      await account.create(ID.unique(), email, password, name);
      
      // Automatically log the user in after successful registration
      await account.createEmailPasswordSession(email, password);
      
      // Success handling
      showToast({ message: 'Account created successfully!', type: 'success' });
      form.reset();
      
      // Trigger the success callback to update global state and navigate
      onRegisterSuccess();
      
    } catch (error) {
      // Error handling
      const errorMessage = formatError(error);
      showError(errorMessage);
      showToast({ message: 'Registration failed', type: 'error' });
      
      // If it's a password error, clear the password field and focus it
      if (errorMessage.toLowerCase().includes('password')) {
        passwordInput.value = '';
        passwordInput.focus();
      }
    } finally {
      setButtonLoading(submitBtn, false, 'Create account');
    }
  });
}