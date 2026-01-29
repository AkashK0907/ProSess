// API Client Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('focus-flow-token');
};

// Set auth token in localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem('focus-flow-token', token);
};

// Remove auth token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('focus-flow-token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// API fetch wrapper with authentication
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    // If offline, network error, or timeout
    if (error instanceof TypeError || error.name === 'AbortError') {
      throw new Error('OFFLINE');
    }
    throw error;
  }
}

// Authentication API
export const authApi = {
  register: async (data: { email: string; password: string; name: string; phone?: string }) => {
    return apiFetch<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (data: { email: string; password: string }) => {
    return apiFetch<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getCurrentUser: async () => {
    return apiFetch<{ user: any }>('/auth/me');
  },

  updateUser: async (data: { name?: string; email?: string; phone?: string }) => {
    return apiFetch<{ user: any }>('/auth/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Habits API
export const habitsApi = {
  getAll: async () => {
    return apiFetch<{ habits: any[] }>('/habits');
  },

  create: async (data: { name: string; emoji?: string; goal: number }) => {
    return apiFetch<{ habit: any }>('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: { name?: string; emoji?: string; goal?: number }) => {
    return apiFetch<{ habit: any }>(`/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiFetch<{ message: string }>(`/habits/${id}`, {
      method: 'DELETE',
    });
  },

  getCompletions: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<{ completions: any[] }>(`/habits/completions${query}`);
  },

  toggleCompletion: async (data: { habitId: string; date: string }) => {
    return apiFetch<{ completion: any }>('/habits/completions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Tasks API
export const tasksApi = {
  getAll: async () => {
    return apiFetch<{ tasks: any[] }>('/tasks');
  },

  create: async (data: { name: string }) => {
    return apiFetch<{ task: any }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: { name: string }) => {
    return apiFetch<{ task: any }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiFetch<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  getCompletions: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<{ completions: any[] }>(`/tasks/completions${query}`);
  },

  toggleCompletion: async (data: { taskId: string; date: string }) => {
    return apiFetch<{ completion: any }>('/tasks/completions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Sessions API
export const sessionsApi = {
  getAll: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<{ sessions: any[] }>(`/sessions${query}`);
  },

  create: async (data: { subject: string; minutes: number; date: string; notes?: string }) => {
    return apiFetch<{ session: any }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<{ subject: string; minutes: number; date: string; notes?: string }>) => {
    return apiFetch<{ session: any }>(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiFetch<{ message: string }>(`/sessions/${id}`, {
      method: 'DELETE',
    });
  },

  getStats: async () => {
    return apiFetch<{
      totalMinutes: number;
      bestDay: string;
      bestDayMinutes: number;
      currentStreak: number;
      highestStreak: number;
    }>('/sessions/stats');
  },
};

// Subjects API
export const subjectsApi = {
  getAll: async () => {
    return apiFetch<{ subjects: any[] }>('/subjects');
  },

  create: async (data: { name: string; color?: string }) => {
    return apiFetch<{ subject: any }>('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: { name?: string; color?: string }) => {
    return apiFetch<{ subject: any }>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiFetch<{ message: string }>(`/subjects/${id}`, {
      method: 'DELETE',
    });
  },
};

