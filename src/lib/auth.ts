import { authApi, setAuthToken, removeAuthToken, isAuthenticated } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
}

// Current user state
let currentUser: User | null = null;

/**
 * Decode a JWT payload without a library.
 * Returns null if the token is malformed.
 */
const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/**
 * Check whether a stored JWT token has expired.
 * Returns `true` if the token is expired or unparseable.
 */
export const isTokenExpired = (): boolean => {
  const token = localStorage.getItem('focus-flow-token');
  if (!token) return true;

  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;

  // exp is in seconds, Date.now() is in ms
  return Date.now() >= payload.exp * 1000;
};

/**
 * Returns true only when a non-expired token exists.
 * If the token exists but is expired, removes it automatically.
 */
export const isTokenValid = (): boolean => {
  if (!isAuthenticated()) return false;
  if (isTokenExpired()) {
    removeAuthToken();
    currentUser = null;
    return false;
  }
  return true;
};

// Get current user from API
export const getCurrentUser = async (): Promise<User | null> => {
  if (!isTokenValid()) {
    return null;
  }

  // Return cached user if available (e.g. from login response)
  if (currentUser) {
    return currentUser;
  }

  try {
    const response = await authApi.getCurrentUser();
    currentUser = response.user;
    return currentUser;
  } catch (error) {
    // Clear cached user so stale data doesn't linger
    currentUser = null;
    console.error('Failed to get current user:', error);
    throw error; // Let React Query handle retry logic instead of caching null
  }
};

// Login
export const login = async (email: string, password: string): Promise<User> => {
  try {
    const response = await authApi.login({ email, password });
    setAuthToken(response.token);
    currentUser = response.user;
    return response.user;
  } catch (error: any) {
    if (error.message === 'OFFLINE') {
      throw new Error('Server is waking up. Please wait a moment and try again.');
    }
    throw new Error(error.message || 'Login failed');
  }
};

// Register
export const register = async (
  email: string,
  password: string,
  name: string,
  phone?: string
): Promise<User> => {
  try {
    const response = await authApi.register({ email, password, name, phone });
    setAuthToken(response.token);
    currentUser = response.user;
    return response.user;
  } catch (error: any) {
    throw new Error(error.message || 'Registration failed');
  }
};

// Logout
export const logout = (): void => {
  removeAuthToken();
  currentUser = null;
  // Redirect to login page
  window.location.href = '/login';
};

// Check authentication status
export const checkAuth = (): boolean => {
  return isAuthenticated();
};

// Get cached current user
export const getCachedUser = (): User | null => {
  return currentUser;
};

export { isAuthenticated };
