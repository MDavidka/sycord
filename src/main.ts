import './style.css';
import { AuthState, AppView, NavigateFunction } from './types';
import { requireElement, showToast, formatError } from './utils';
import { account } from './appwrite';
import { renderHeader } from './components/header';
import { renderLoginForm } from './components/login-form';
import { renderRegisterForm } from './components/register-form';
import { renderDashboard } from './components/dashboard';
import { renderSpinner } from './components/ui';

/**
 * Global Application State
 */
let state: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null
};

let currentView: AppView = 'loading';

/**
 * DOM Container References
 */
let headerContainer: HTMLElement;
let mainContainer: HTMLElement;

/**
 * Core Navigation Logic
 * Handles routing between views and protects authenticated routes.
 */
const navigate: NavigateFunction = (view) => {
  // Protect the dashboard route
  if (view === 'dashboard' && !state.isAuthenticated && !state.isLoading) {
    currentView = 'login';
    showToast({ message: 'Please log in to access the dashboard.', type: 'info' });
  } else {
    currentView = view;
  }
  
  // Re-render the application with the new view
  render();
};

/**
 * Authentication Success Handler
 * Called after successful login or registration.
 */
const handleAuthSuccess = async () => {
  // Re-verify the session and fetch user details
  await checkSession();
};

/**
 * Logout Handler
 * Destroys the current Appwrite session and resets application state.
 */
const handleLogout = async () => {
  try {
    // Optimistically update UI to loading state
    mainContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full animate-fade-in">
        ${renderSpinner('w-10 h-10 text-[var(--color-primary)] mb-4')}
        <p class="text-[var(--color-text-muted)] font-medium">Signing out securely...</p>
      </div>
    `;

    // Appwrite SDK Call: Delete the current session
    await account.deleteSession('current');
    
    // Reset state
    state.isAuthenticated = false;
    state.user = null;
    
    showToast({ message: 'Successfully logged out', type: 'success' });
    navigate('login');
  } catch (error) {
    const errorMessage = formatError(error);
    showToast({ message: `Logout failed: ${errorMessage}`, type: 'error' });
    
    // Even if the API call fails, clear local state to prevent being stuck
    state.isAuthenticated = false;
    state.user = null;
    navigate('login');
  }
};

/**
 * Session Verification
 * Checks if the user has an active session on initial load or after auth events.
 */
const checkSession = async () => {
  state.isLoading = true;
  currentView = 'loading';
  render(); // Show loading screen

  try {
    // Appwrite SDK Call: Get the currently logged in user
    const user = await account.get();
    
    // Session exists and is valid
    state.isAuthenticated = true;
    state.user = user;
    state.error = null;
    
    // Automatically route to dashboard if authenticated
    navigate('dashboard');
  } catch (error: any) {
    // No active session or session expired
    state.isAuthenticated = false;
    state.user = null;
    
    // Appwrite returns 401 for unauthenticated users, which is expected behavior
    if (error?.code !== 401) {
      state.error = formatError(error);
      console.error('Session check error:', error);
    }
    
    // Route to login if not authenticated
    navigate('login');
  } finally {
    state.isLoading = false;
    render(); // Final render with updated state
  }
};

/**
 * Main Render Function
 * Orchestrates the rendering of the Header and the current Main View.
 */
const render = () => {
  // 1. Render Header (always visible, adapts to auth state)
  renderHeader(headerContainer, state, navigate, handleLogout);

  // 2. Render Main Content based on currentView
  mainContainer.innerHTML = ''; // Clear previous content

  if (state.isLoading || currentView === 'loading') {
    mainContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full animate-fade-in">
        ${renderSpinner('w-12 h-12 text-[var(--color-primary)] mb-4')}
        <p class="text-[var(--color-text-muted)] font-medium">Initializing application...</p>
      </div>
    `;
    return;
  }

  switch (currentView) {
    case 'login':
      renderLoginForm(mainContainer, navigate, handleAuthSuccess);
      break;
    case 'register':
      renderRegisterForm(mainContainer, navigate, handleAuthSuccess);
      break;
    case 'dashboard':
      if (state.isAuthenticated) {
        renderDashboard(mainContainer, navigate, handleLogout);
      } else {
        // Fallback protection if state gets out of sync
        navigate('login');
      }
      break;
    default:
      navigate('login');
  }
};

/**
 * Application Initialization
 * Sets up the DOM structure and starts the authentication flow.
 */
export async function initApp() {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    throw new Error('Critical Error: Root element #app not found in the DOM.');
  }

  // Setup the base layout structure
  appContainer.innerHTML = `
    <div id="header-container"></div>
    <main id="main-container" class="flex-grow flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto relative"></main>
    <footer class="py-6 text-center text-sm text-[var(--color-text-muted)] border-t border-[var(--color-border)] mt-auto bg-[var(--color-bg)]">
      <p>&copy; ${new Date().getFullYear()} AuthPortal. Secured by Appwrite.</p>
    </footer>
  `;

  // Cache container references
  headerContainer = requireElement<HTMLElement>('#header-container', appContainer);
  mainContainer = requireElement<HTMLElement>('#main-container', appContainer);

  // Start the authentication check flow
  await checkSession();
}

// Bootstrap the application
// Since this is a type="module" script, the DOM is already parsed.
initApp().catch((error) => {
  console.error('Failed to initialize application:', error);
  document.body.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <div class="bg-white p-6 rounded-lg shadow-xl border border-red-200 max-w-md w-full text-center">
        <h1 class="text-xl font-bold text-red-600 mb-2">Application Error</h1>
        <p class="text-gray-600 text-sm">${formatError(error)}</p>
      </div>
    </div>
  `;
});