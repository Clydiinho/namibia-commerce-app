export const getBusinessId = () => localStorage.getItem('businessId');

export const getApiBaseUrl = () => {
  return (import.meta as any).env.VITE_API_BASE_URL || '';
};

/**
 * A reusable fetch wrapper that automatically appends the business_id
 * to the query parameters and handles common error responses.
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const businessId = getBusinessId();
  if (!businessId) {
    throw new Error('Authentication required: No business_id found.');
  }

  // Construct URL and append business_id
  const url = new URL(`${getApiBaseUrl()}${endpoint}`, window.location.origin);
  url.searchParams.append('business_id', businessId);

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred while fetching data.';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // Fallback if response is not JSON
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const api = {
  get: (endpoint: string, options?: RequestInit) => apiFetch(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, body: any, options?: RequestInit) => apiFetch(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: any, options?: RequestInit) => apiFetch(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string, options?: RequestInit) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
};
