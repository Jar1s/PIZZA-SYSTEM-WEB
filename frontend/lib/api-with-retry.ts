/**
 * API wrapper with retry logic and better error handling
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryableStatuses?: number[];
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryableStatuses: [408, 429, 500, 502, 503, 504], // Timeout, Too Many Requests, Server Errors
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get user-friendly error message from error
 */
export function getUserFriendlyError(error: any): string {
  if (typeof error === 'string') return error;
  
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('failed to fetch') || message.includes('network')) {
      return 'Problém s pripojením. Skontrolujte internetové pripojenie a skúste to znova.';
    }
    
    // Timeout errors
    if (message.includes('timeout')) {
      return 'Požiadavka trvala príliš dlho. Skúste to znova.';
    }
    
    // Server errors
    if (message.includes('500') || message.includes('internal server')) {
      return 'Chyba na serveri. Skúste to znova o chvíľu.';
    }
    
    // Not found
    if (message.includes('404') || message.includes('not found')) {
      return 'Požadovaný obsah sa nenašiel.';
    }
    
    // Unauthorized
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'Musíte sa prihlásiť, aby ste mohli pokračovať.';
    }
    
    // Forbidden
    if (message.includes('403') || message.includes('forbidden')) {
      return 'Nemáte oprávnenie na túto akciu.';
    }
    
    // Return original message if it's user-friendly
    return error.message;
  }
  
  return 'Nastala neočakávaná chyba. Skúste to znova.';
}

/**
 * Fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
      
      // If successful or non-retryable error, return immediately
      if (response.ok || !opts.retryableStatuses.includes(response.status)) {
        return response;
      }
      
      // If last attempt, throw error
      if (attempt === opts.maxRetries) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      // Wait before retry (exponential backoff)
      const delay = opts.retryDelay * Math.pow(2, attempt);
      await sleep(delay);
      
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on abort (timeout) or non-retryable errors
      if (error.name === 'AbortError' || attempt === opts.maxRetries) {
        throw error;
      }
      
      // Wait before retry
      const delay = opts.retryDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  
  throw lastError || new Error('Request failed after retries');
}

/**
 * API call with retry and error handling
 */
export async function apiCall<T>(
  url: string,
  options: RequestInit = {},
  retryOptions?: RetryOptions
): Promise<T> {
  try {
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
    const response = await fetchWithRetry(fullUrl, options, retryOptions);
    
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error: any) {
    // Re-throw with user-friendly message
    throw new Error(getUserFriendlyError(error));
  }
}

