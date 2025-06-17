import { useAuth } from '../context/AuthContext';

/**
 * Custom hook that returns API functions with authentication
 */
export const useApi = () => {
  const { token } = useAuth();

  /**
   * Make authenticated API requests
   */
  const fetchWithAuth = async (
    url: string, 
    options: RequestInit = {}
  ): Promise<any> => {
    // Create a headers object that TypeScript understands
    const headersInit: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const response = await fetch(url, {
      ...options,
      headers: headersInit,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API request failed with status ${response.status}`);
    }

    return response.json();
  };

  /**
   * Get user's watchlist
   */
  const getUserWatchlist = async () => {
    return fetchWithAuth('/api/user/watchlist');
  };

  /**
   * Add stock to user's watchlist
   */
  const addToUserWatchlist = async (symbol: string, companyName: string, notes?: string) => {
    return fetchWithAuth('/api/user/watchlist', {
      method: 'POST',
      body: JSON.stringify({
        symbol,
        company_name: companyName,
        notes
      }),
    });
  };

  /**
   * Remove stock from user's watchlist
   */
  const removeFromUserWatchlist = async (itemId: number) => {
    return fetchWithAuth(`/api/user/watchlist/${itemId}`, {
      method: 'DELETE',
    });
  };

  /**
   * Check if stock is in user's watchlist
   */
  const checkUserWatchlist = async (symbol: string) => {
    return fetchWithAuth(`/api/user/watchlist/check/${symbol}`);
  };

  /**
   * Analyze a stock
   */
  const analyzeStock = async (ticker: string) => {
    return fetchWithAuth('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ ticker }),
    });
  };

  /**
   * Get stock screening results
   */
  const getScreeningResults = async (screenType: string) => {
    return fetchWithAuth(`/api/screen/${screenType}`);
  };

  return {
    getUserWatchlist,
    addToUserWatchlist,
    removeFromUserWatchlist,
    checkUserWatchlist,
    analyzeStock,
    getScreeningResults,
    fetchWithAuth,
  };
};
