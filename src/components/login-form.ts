import { NavigateFunction } from '../types';
import { 
  requireElement, 
  isValidEmail, 
  formatError, 
  setButtonLoading, 
  showToast 
} from '../utils';
import { account } from '../appwrite';
import { 
  renderInput, 
  renderButton, 
  renderCard, 
  renderAlert, 
  renderDivider 
} from './ui';

/**
 * Renders the login form component and handles authentication logic.
 * 
 * @param container - The DOM element where the form will be mounted.
 * @param navigate - Function to trigger view changes (routing).
 * @param onLoginSuccess - Callback function executed after a successful login.
 */
export function renderLoginForm(
  container: HTMLElement,
  navigate: NavigateFunction,
  onLoginSuccess: () => void
): void {
  // Build the form HTML using UI components
  const formContent = `
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold tracking-tight text-[var(--color-text)] mb-2">
        Welcome back
      </h1>
      <p class="text-sm text-[var(--color-text-muted)]">
        Enter your credentials to access your account
      </p>
    </div>

    <div id="login-error-container" class="hidden"></div>

    <form id="login-form" class="space-y-4" novalidate>
      ${renderInput({
        id: 'login-email',
        type: 'email',
        label: 'Email address',
        placeholder: 'name@example.com',
        required: true,
        autocomplete: 'email'
      })}

      ${renderInput({
        id: 'login-password',
        type: 'password',
        label: 'Password',
        placeholder: '••••••••',
        required: true,
        autocomplete: 'current-password'
      })}

      <div class="pt-2">
        ${renderButton({
          id: 'login-submit-btn',
          type: 'submit',
          text: 'Sign in',
          variant: 'primary',
          className: 'w-full'
        })}
      </div>
    </form>

    ${renderDivider('Or continue with')}

    <div class="text-center text-sm">
      <span class="text-[var(--color-text-muted)]">Don't have an account?</span>
      <button 
        id="link-to-register" 
        class="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors focus:outline-none focus:underline ml-1"
      >
        Sign up
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
  const form = requireElement<HTMLFormElement>('#login-form', container);
  const emailInput = requireElement<HTMLInputElement>('#login-email', container);
  const passwordInput = requireElement<HTMLInputElement>('#login-password', container);
  const submitBtn = requireElement<HTMLButtonElement>('#login-submit-btn', container);
  const errorContainer = requireElement<HTMLDivElement>('#login-error-container', container);
  const registerLink = requireElement<HTMLButtonElement>('#link-to-register', container);

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
  registerLink.addEventListener('click', () => {
    navigate('register');
  });

  // Form Submission Event
  form.addEventListener('submit', async (e: Event) => {
    e.preventDefault();
    hideError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Basic Client-Side Validation
    if (!email || !password) {
      showError('Please fill in all required fields.');
      return;
    }

    if (!isValidEmail(email)) {
      showError('Please enter a valid email address.');
      emailInput.focus();
      return;
    }

    // Proceed with Authentication
    try {
      setButtonLoading(submitBtn, true, 'Sign in');
      
      // Appwrite SDK Call: Create a new session
      await account.createEmailPasswordSession(email, password);
      
      // Success handling
      showToast({ message: 'Successfully logged in!', type: 'success' });
      form.reset();
      
      // Trigger the success callback to update global state and navigate
      onLoginSuccess();
      
    } catch (error) {
      // Error handling
      const errorMessage = formatError(error);
      showError(errorMessage);
      showToast({ message: 'Login failed', type: 'error' });
      
      // If it's a password error, clear the password field and focus it
      if (errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('credentials')) {
        passwordInput.value = '';
        passwordInput.focus();
      }
    } finally {
      setButtonLoading(submitBtn, false, 'Sign in');
    }
  });
}