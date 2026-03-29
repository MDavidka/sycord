import { AuthState, NavigateFunction } from '../types';
import { escapeHTML } from '../utils';
import { renderButton } from './ui';

/**
 * Renders the application header and navigation.
 * Conditionally displays links and user information based on the current authentication state.
 * 
 * @param container - The DOM element where the header will be mounted.
 * @param authState - The current authentication state (user info, auth status).
 * @param navigate - Function to trigger view changes (routing).
 * @param onLogout - Callback function to handle user logout.
 */
export function renderHeader(
  container: HTMLElement,
  authState: AuthState,
  navigate: NavigateFunction,
  onLogout: () => void
): void {
  const { isAuthenticated, user } = authState;
  const userName = user?.name || 'User';

  // Determine which navigation items to show based on auth state
  let navItemsHtml = '';

  if (isAuthenticated) {
    navItemsHtml = `
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium text-[var(--color-text-muted)] hidden sm:inline-block">
          Welcome, <span class="text-[var(--color-text)]">${escapeHTML(userName)}</span>
        </span>
        ${renderButton({
          id: 'nav-logout-btn',
          text: 'Log Out',
          variant: 'secondary',
          className: 'py-1.5 px-4 text-sm !w-auto'
        })}
      </div>
    `;
  } else {
    navItemsHtml = `
      <div class="flex items-center gap-4">
        <button id="nav-login-btn" class="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-md px-2 py-1">
          Log In
        </button>
        ${renderButton({
          id: 'nav-register-btn',
          text: 'Sign Up',
          variant: 'primary',
          className: 'py-1.5 px-4 text-sm !w-auto'
        })}
      </div>
    `;
  }

  // Build the full header HTML
  container.innerHTML = `
    <header class="sticky top-0 z-40 w-full backdrop-blur flex-none transition-colors duration-500 lg:z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          <!-- Brand / Logo -->
          <div 
            class="flex-shrink-0 cursor-pointer flex items-center gap-2.5 group focus:outline-none rounded-md focus:ring-2 focus:ring-[var(--color-primary)] p-1 -ml-1" 
            id="nav-brand-link"
            tabindex="0"
            role="button"
            aria-label="Go to home"
          >
            <div class="bg-[var(--color-primary)]/10 p-1.5 rounded-lg group-hover:bg-[var(--color-primary)]/20 transition-colors">
              <svg class="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <span class="font-bold text-lg tracking-tight text-[var(--color-text)]">AuthPortal</span>
          </div>
          
          <!-- Navigation Actions -->
          <nav aria-label="Main navigation">
            ${navItemsHtml}
          </nav>
          
        </div>
      </div>
    </header>
  `;

  // Attach Event Listeners
  
  // Brand Link (Logo)
  const brandLink = container.querySelector('#nav-brand-link');
  if (brandLink) {
    const handleBrandClick = () => {
      navigate(isAuthenticated ? 'dashboard' : 'login');
    };
    brandLink.addEventListener('click', handleBrandClick);
    brandLink.addEventListener('keydown', (e) => {
      const keyboardEvent = e as KeyboardEvent;
      if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
        e.preventDefault();
        handleBrandClick();
      }
    });
  }

  // Auth-specific buttons
  if (isAuthenticated) {
    const logoutBtn = container.querySelector('#nav-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', onLogout);
    }
  } else {
    const loginBtn = container.querySelector('#nav-login-btn');
    const registerBtn = container.querySelector('#nav-register-btn');
    
    if (loginBtn) {
      loginBtn.addEventListener('click', () => navigate('login'));
    }
    if (registerBtn) {
      registerBtn.addEventListener('click', () => navigate('register'));
    }
  }
}