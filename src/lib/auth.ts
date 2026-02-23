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

// Get current user from API
export const getCurrentUser = async (): Promise<User | null> => {
  if (!isAuthenticated()) {
    return null;
  }

  try {
    const response = await authApi.getCurrentUser();
    currentUser = response.user;
    return currentUser;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
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
