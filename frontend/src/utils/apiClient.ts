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

    url = (process.env.REACT_APP_SERVER_URL || 'http://localhost:500111') + url;
console.log('ron klod - Using SERVER_URL:', process.env);

    console.log('ron klod - Making API request to:', url);
    const response = await fetch(url, {
      ...options,
      headers: headersInit,
    });

    if (!response.ok) {
      try {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API request failed with status ${response.status}`);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        const errorText = await response.text();
        console.error('Response text:', errorText);
        throw new Error(`API request failed: ${response.statusText} (${response.status})`);
      }
    }

    try {
      return await response.json();
    } catch (parseError) {
      console.error('Error parsing successful response:', parseError);
      const responseText = await response.text();
      console.error('Response text:', responseText);
      throw new Error('Invalid response format from server');
    }
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
   * Analyze stock using AI (Groq)
   */
  const analyzeStockAI = async (ticker: string) => {
    return fetchWithAuth('/api/analyze-ai', {
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
    analyzeStockAI,
    getScreeningResults,
    fetchWithAuth,
  };
};
