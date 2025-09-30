// API utilities for making authenticated requests

export const API_BASE_URL = 'http://localhost:8090';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Make an authenticated API request
 * @param endpoint - API endpoint (e.g., '/api/sports')
 * @param options - Fetch options
 * @returns Promise with response data
 */
export async function makeAuthenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return {
        error: 'No authentication token found. Please login again.',
        status: 401
      };
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem('token');
        return {
          error: 'Authentication failed. Please login again.',
          status: response.status
        };
      }
      return {
        error: `HTTP error! status: ${response.status}`,
        status: response.status
      };
    }

    const data = await response.json();
    return {
      data,
      status: response.status
    };

  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error occurred',
      status: 500
    };
  }
}

/**
 * Make an unauthenticated API request (for login, register, etc.)
 * @param endpoint - API endpoint
 * @param options - Fetch options
 * @returns Promise with response data
 */
export async function makeUnauthenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    return {
      data,
      status: response.status
    };

  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error occurred',
      status: 500
    };
  }
}