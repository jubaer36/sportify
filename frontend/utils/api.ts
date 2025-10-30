// API utilities for making authenticated requests

export const API_BASE_URL = 'http://localhost:8090';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Refresh the access token using the refresh token
 * @returns Promise with new token or null if refresh fails
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      console.error('[API] No refresh token found');
      return null;
    }

    console.log('[API] Attempting to refresh access token...');
    
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Token refresh failed:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    if (data.token && data.refreshToken) {
      // Update both tokens in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      console.log('[API] ✅ Token refreshed successfully');
      return data.token;
    } else {
      console.error('[API] Token refresh response missing token data:', data);
      return null;
    }

  } catch (error) {
    console.error('[API] Error refreshing token:', error);
    return null;
  }
}

/**
 * Make an authenticated API request
 * @param endpoint - API endpoint (e.g., '/api/sports')
 * @param options - Fetch options
 * @param isRetry - Internal flag to prevent infinite retry loops
 * @returns Promise with response data
 */
export async function makeAuthenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry: boolean = false
): Promise<ApiResponse<T>> {
  try {
    let token = localStorage.getItem('token');
    
    console.log('[API] Making request to:', endpoint, isRetry ? '(retry)' : '');
    
    // If no token on first attempt, check if we can refresh
    if (!token && !isRetry) {
      console.log('[API] No token found, attempting to use refresh token...');
      const newToken = await refreshAccessToken();
      if (newToken) {
        token = newToken;
        console.log('[API] Successfully obtained token via refresh');
      } else {
        console.error('[API] No token and refresh failed');
        return {
          error: 'No authentication token found. Please login again.',
          status: 401
        };
      }
    } else if (!token && isRetry) {
      // On retry, if still no token, we've already tried refresh
      console.error('[API] No token found after refresh attempt');
      return {
        error: 'Session expired. Please login again.',
        status: 401
      };
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    };
    // Only set JSON content type when there is a request body
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 401 && !isRetry) {
        // Token might be expired, try to refresh it
        console.log('[API] 401 Unauthorized - attempting token refresh...');
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          // Retry the original request with the new token
          console.log('[API] Retrying request with refreshed token...');
          return makeAuthenticatedRequest<T>(endpoint, options, true);
        } else {
          // Refresh failed, clear tokens and ask user to login
          console.error('[API] Token refresh failed - clearing tokens');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          return {
            error: 'Session expired. Please login again.',
            status: response.status
          };
        }
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