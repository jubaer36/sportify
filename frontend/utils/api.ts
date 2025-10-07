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
    
    console.log('[API] Making request to:', endpoint);
    // console.log('[API] Token exists:', !!token);
    
    if (!token) {
      console.error('[API] No token found in localStorage');
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

    // console.log('[API] Request headers:', headers);
    // console.log('[API] Request URL:', url);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // console.log('[API] Response status:', response.status);
    // console.log('[API] Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      // console.error('[API] Error response:', errorText);
      
      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem('token');
        return {
          error: 'Authentication failed. Please login again.',
          status: response.status
        };
      }
      
      // Try to parse error as JSON if possible
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If not JSON, use the raw text
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      return {
        error: errorMessage,
        status: response.status
      };
    }

    // Handle empty responses (like 204 No Content)
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type');
    
    if (response.status === 204 || contentLength === '0' || 
        (!contentType || !contentType.includes('application/json'))) {
      console.log('[API] Empty or non-JSON response');
      return {
        data: null as T,
        status: response.status
      };
    }

    try {
      const data = await response.json();
      // console.log('[API] Response data:', data);
      return {
        data,
        status: response.status
      };
    } catch (error) {
      console.warn('[API] Failed to parse JSON response, treating as empty');
      return {
        data: null as T,
        status: response.status
      };
    }

  } catch (error) {
    console.error('[API] Network error:', error);
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