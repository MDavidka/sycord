import { NavigateFunction } from '../types';
import { 
  requireElement, 
  escapeHTML, 
  formatError, 
  showToast,
  setButtonLoading
} from '../utils';
import { account } from '../appwrite';
import { 
  renderCard, 
  renderSpinner, 
  renderButton, 
  renderAlert 
} from './ui';

/**
 * Renders the protected dashboard component.
 * Fetches the latest user details from Appwrite and displays them.
 * 
 * @param container - The DOM element where the dashboard will be mounted.
 * @param navigate - Function to trigger view changes (routing).
 * @param onLogout - Callback function executed to log the user out.
 */
export async function renderDashboard(
  container: HTMLElement,
  navigate: NavigateFunction,
  onLogout: () => void
): Promise<void> {
  // 1. Display initial loading state
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-16 animate-fade-in">
      ${renderSpinner('w-10 h-10 text-[var(--color-primary)] mb-4')}
      <p class="text-[var(--color-text-muted)] font-medium">Loading your secure dashboard...</p>
    </div>
  `;

  try {
    // 2. Fetch the latest user details from Appwrite
    // This acts as a security check to ensure the session is still valid
    const user = await account.get();

    // Format the creation date safely
    const joinDate = user.$createdAt 
      ? new Date(user.$createdAt).toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'Unknown';

    // 3. Build the dashboard UI
    const dashboardContent = `
      <div class="space-y-8">
        <!-- Header Section -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Dashboard
            </h1>
            <p class="text-sm text-[var(--color-text-muted)] mt-1">
              Welcome back, <span class="font-medium text-[var(--color-text)]">${escapeHTML(user.name || 'User')}</span>!
            </p>
          </div>
          <div class="flex items-center gap-3">
            ${renderButton({
              id: 'dashboard-refresh-btn',
              text: 'Refresh',
              variant: 'secondary',
              className: 'py-1.5 px-3 text-sm'
            })}
          </div>
        </div>

        <!-- User Details Section -->
        <div class="bg-[var(--color-bg)] rounded-xl p-5 sm:p-6 border border-[var(--color-border)] shadow-sm">
          <h2 class="text-lg font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            Account Profile
          </h2>
          
          <dl class="space-y-4 text-sm">
            <div class="grid grid-cols-1 sm:grid-cols-3 sm:gap-4 items-center py-2 border-b border-[var(--color-border)]/50 last:border-0">
              <dt class="font-medium text-[var(--color-text-muted)] mb-1 sm:mb-0">Full Name</dt>
              <dd class="sm:col-span-2 text-[var(--color-text)] font-medium">
                ${escapeHTML(user.name || 'Not provided')}
              </dd>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 sm:gap-4 items-center py-2 border-b border-[var(--color-border)]/50 last:border-0">
              <dt class="font-medium text-[var(--color-text-muted)] mb-1 sm:mb-0">Email Address</dt>
              <dd class="sm:col-span-2 text-[var(--color-text)]">
                ${escapeHTML(user.email)}
                ${user.emailVerification 
                  ? `<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-success-bg)] text-[var(--color-success-text)]">Verified</span>`
                  : `<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-error-bg)] text-[var(--color-error-text)]">Unverified</span>`
                }
              </dd>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 sm:gap-4 items-center py-2 border-b border-[var(--color-border)]/50 last:border-0">
              <dt class="font-medium text-[var(--color-text-muted)] mb-1 sm:mb-0">Account ID</dt>
              <dd class="sm:col-span-2 text-[var(--color-text-muted)] font-mono text-xs bg-[var(--color-bg-card)] px-2 py-1 rounded border border-[var(--color-border)] inline-block w-fit">
                ${escapeHTML(user.$id)}
              </dd>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 sm:gap-4 items-center py-2 border-b border-[var(--color-border)]/50 last:border-0">
              <dt class="font-medium text-[var(--color-text-muted)] mb-1 sm:mb-0">Member Since</dt>
              <dd class="sm:col-span-2 text-[var(--color-text)]">
                ${escapeHTML(joinDate)}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Actions Section -->
        <div class="pt-2 flex flex-col sm:flex-row gap-3 sm:justify-end">
          ${renderButton({
            id: 'dashboard-logout-btn',
            text: 'Sign Out Securely',
            variant: 'primary',
            className: 'w-full sm:w-auto'
          })}
        </div>
      </div>
    `;

    // Mount the dashboard content
    container.innerHTML = `
      <div class="w-full max-w-4xl mx-auto animate-fade-in">
        ${renderCard(dashboardContent, 'p-6 sm:p-8')}
      </div>
    `;

    // 4. Attach Event Listeners
    const logoutBtn = requireElement<HTMLButtonElement>('#dashboard-logout-btn', container);
    const refreshBtn = requireElement<HTMLButtonElement>('#dashboard-refresh-btn', container);

    // Logout Action
    logoutBtn.addEventListener('click', () => {
      setButtonLoading(logoutBtn, true, 'Signing out...');
      onLogout();
    });

    // Refresh Action (re-renders the component)
    refreshBtn.addEventListener('click', () => {
      setButtonLoading(refreshBtn, true, 'Refreshing...');
      renderDashboard(container, navigate, onLogout);
    });

  } catch (error) {
    // Handle errors (e.g., session expired, network issues)
    const errorMessage = formatError(error);
    
    // If it's an unauthorized error, the session is likely invalid
    if (errorMessage.toLowerCase().includes('unauthorized') || errorMessage.toLowerCase().includes('missing scope')) {
      showToast({ message: 'Your session has expired. Please log in again.', type: 'error' });
      onLogout(); // Trigger logout flow to clean up state
      return;
    }

    // For other errors, show an error state with a retry option
    container.innerHTML = `
      <div class="w-full max-w-2xl mx-auto animate-fade-in">
        ${renderCard(`
          <div class="text-center py-6">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-error-bg)] mb-4">
              <svg class="w-6 h-6 text-[var(--color-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-[var(--color-text)] mb-2">Failed to load dashboard</h2>
            <p class="text-[var(--color-text-muted)] mb-6">${escapeHTML(errorMessage)}</p>
            <div class="flex justify-center gap-4">
              ${renderButton({
                id: 'error-retry-btn',
                text: 'Try Again',
                variant: 'primary'
              })}
              ${renderButton({
                id: 'error-login-btn',
                text: 'Return to Login',
                variant: 'secondary'
              })}
            </div>
          </div>
        `)}
      </div>
    `;

    const retryBtn = container.querySelector('#error-retry-btn');
    const loginBtn = container.querySelector('#error-login-btn');

    if (retryBtn) {
      retryBtn.addEventListener('click', () => renderDashboard(container, navigate, onLogout));
    }
    if (loginBtn) {
      loginBtn.addEventListener('click', () => navigate('login'));
    }
  }
}