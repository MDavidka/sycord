export interface SiteConfig {
  title: string;
  description: string;
}

export interface NavItem {
  label: string;
  href: string;
  requiresAuth?: boolean;
  hideWhenAuth?: boolean;
}

export interface AppwriteUser {
  $id: string;
  name: string;
  email: string;
  emailVerification: boolean;
  status: boolean;
  registration: string;
  // Allow other Appwrite specific fields that might be returned
  [key: string]: any; 
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AppwriteUser | null;
  isLoading: boolean;
  error: string | null;
}

export type AppView = 'login' | 'register' | 'dashboard' | 'loading';

export type NavigateFunction = (view: AppView) => void;

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}

export interface ToastNotification {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}