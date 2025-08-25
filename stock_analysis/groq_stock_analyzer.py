#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Groq API Client for Stock Analysis
Provides AI-powered stock analysis using Groq's fast inference
"""

import json
import logging
import os
from typing import Dict, List, Optional
import yfinance as yf
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GroqStockAnalyzer:
    """Client for interacting with Groq API to provide AI-powered stock analysis."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Groq stock analyzer.
        
        Args:
            api_key: Groq API key. If not provided, will try to get from environment
        """
        self.api_key = api_key or os.getenv('GROQ_API_KEY')
        self.base_url = "https://api.groq.com/openai/v1"
        
        # Set up requests session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        if not self.api_key:
            logger.warning("No Groq API key provided. Set GROQ_API_KEY environment variable or pass api_key parameter.")
    
    def analyze_stock(self, ticker: str) -> Dict[str, str]:
        """
        Analyze a stock using Groq AI and return comprehensive analysis.
        
        Args:
            ticker: The stock ticker symbol
            
        Returns:
            Dictionary with AI analysis results
        """
        if not self.api_key:
            logger.error("No Groq API key available")
            return {"error": "No Groq API key configured"}
        
        try:
            # Get stock data first
            stock_data = self._get_stock_data(ticker)
            if not stock_data:
                return {"error": f"Could not fetch data for ticker {ticker}"}
            
            # Create the prompt for stock analysis
            prompt = self._create_analysis_prompt(ticker, stock_data)
            
            # Make API request
            response = self._make_api_request(prompt)
            
            if not response:
                return {"error": "Failed to get response from Groq API"}
            
            # Parse the response
            analysis = self._parse_analysis_response(response)
            
            logger.info(f"Successfully analyzed stock {ticker} with AI")
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing stock with AI: {str(e)}")
            return {"error": str(e)}
    
    def _get_stock_data(self, ticker: str) -> Optional[Dict]:
        """Get basic stock data using yfinance."""
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            hist = stock.history(period="1mo")
            
            if hist.empty:
                return None
            
            current_price = hist['Close'].iloc[-1]
            previous_price = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
            change = current_price - previous_price
            change_percent = (change / previous_price) * 100 if previous_price != 0 else 0
            
            return {
                "ticker": ticker,
                "company_name": info.get('longName', ticker),
                "sector": info.get('sector', 'Unknown'),
                "industry": info.get('industry', 'Unknown'),
                "current_price": round(current_price, 2),
                "price_change": round(change, 2),
                "price_change_percent": round(change_percent, 2),
                "market_cap": info.get('marketCap', 0),
                "pe_ratio": info.get('trailingPE', None),
                "52_week_high": info.get('fiftyTwoWeekHigh', None),
                "52_week_low": info.get('fiftyTwoWeekLow', None),
                "volume": info.get('volume', 0),
                "avg_volume": info.get('averageVolume', 0),
                "dividend_yield": info.get('dividendYield', 0),
                "beta": info.get('beta', None),
                "description": info.get('longBusinessSummary', '')[:500] + '...' if info.get('longBusinessSummary') else ''
            }
        except Exception as e:
            logger.error(f"Error fetching stock data: {str(e)}")
            return None
    
    def _create_analysis_prompt(self, ticker: str, stock_data: Dict) -> str:
        """Create a comprehensive prompt for AI stock analysis."""
        return f"""
You are an expert financial analyst with deep knowledge of stock markets, technical analysis, and fundamental analysis. 

Analyze the following stock and provide a comprehensive investment analysis:

STOCK: {ticker} - {stock_data.get('company_name', ticker)}

CURRENT DATA:
- Current Price: ${stock_data.get('current_price', 'N/A')}
- Price Change: ${stock_data.get('price_change', 'N/A')} ({stock_data.get('price_change_percent', 'N/A')}%)
- Sector: {stock_data.get('sector', 'Unknown')}
- Industry: {stock_data.get('industry', 'Unknown')}
- Market Cap: ${stock_data.get('market_cap', 'N/A'):,} if stock_data.get('market_cap') else 'N/A'
- P/E Ratio: {stock_data.get('pe_ratio', 'N/A')}
- 52-Week Range: ${stock_data.get('52_week_low', 'N/A')} - ${stock_data.get('52_week_high', 'N/A')}
- Volume: {stock_data.get('volume', 'N/A'):,} if stock_data.get('volume') else 'N/A'
- Beta: {stock_data.get('beta', 'N/A')}
- Dividend Yield: {stock_data.get('dividend_yield', 0) * 100:.2f}% if stock_data.get('dividend_yield') else '0%'

COMPANY DESCRIPTION:
{stock_data.get('description', 'No description available')}

Please provide a comprehensive analysis in JSON format with the following structure:

{{
  "overall_sentiment": "BULLISH/BEARISH/NEUTRAL",
  "confidence_score": "1-10 scale",
  "investment_recommendation": "BUY/SELL/HOLD",
  "price_target": "estimated fair value",
  "time_horizon": "SHORT_TERM/MEDIUM_TERM/LONG_TERM",
  "key_strengths": ["strength1", "strength2", "strength3"],
  "key_risks": ["risk1", "risk2", "risk3"],
  "fundamental_analysis": "detailed fundamental analysis paragraph",
  "technical_outlook": "technical analysis perspective paragraph",
  "sector_analysis": "sector and industry outlook paragraph", 
  "catalysts": ["positive catalyst1", "positive catalyst2"],
  "concerns": ["concern1", "concern2"],
  "summary": "executive summary paragraph"
}}

Focus on:
1. Fundamental analysis (valuation, financials, competitive position)
2. Technical patterns and price action
3. Sector/industry trends and outlook
4. Market conditions and sentiment
5. Risk-reward assessment
6. Catalysts and potential concerns

Provide actionable insights for investors. Be objective and consider both bullish and bearish perspectives.

JSON Response:"""

    def _make_api_request(self, prompt: str) -> Optional[str]:
        """Make API request to Groq."""
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a professional financial analyst with expertise in stock analysis. Provide detailed, objective analysis in the requested JSON format. Base your analysis on the provided data and general market knowledge."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "model": "llama-3.3-70b-versatile",
                "temperature": 0.3,
                "max_tokens": 2000
            }
            
            response = self.session.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            
            response.raise_for_status()
            result = response.json()
            
            if 'choices' in result and len(result['choices']) > 0:
                return result['choices'][0]['message']['content'].strip()
            
            logger.error("Unexpected API response format")
            return None
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {str(e)}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse API response: {str(e)}")
            return None
    
    def _parse_analysis_response(self, response: str) -> Dict[str, str]:
        """Parse the analysis response from Groq API."""
        try:
            # Try to find JSON in the response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            if json_start != -1 and json_end != -1:
                json_str = response[json_start:json_end]
                analysis = json.loads(json_str)
                
                # Validate required fields and provide defaults
                required_fields = [
                    'overall_sentiment', 'confidence_score', 'investment_recommendation',
                    'key_strengths', 'key_risks', 'fundamental_analysis',
                    'technical_outlook', 'summary'
                ]
                
                for field in required_fields:
                    if field not in analysis:
                        analysis[field] = "Not provided"
                
                # Ensure lists are actually lists
                for list_field in ['key_strengths', 'key_risks', 'catalysts', 'concerns']:
                    if list_field in analysis and not isinstance(analysis[list_field], list):
                        analysis[list_field] = [str(analysis[list_field])]
                
                return analysis
            
            # If no JSON found, return the response as summary
            logger.warning("No valid JSON found in response, returning as text")
            return {
                "overall_sentiment": "NEUTRAL",
                "confidence_score": "5",
                "investment_recommendation": "HOLD",
                "summary": response,
                "key_strengths": ["AI analysis provided"],
                "key_risks": ["Analysis format not structured"],
                "fundamental_analysis": "Please see summary for details",
                "technical_outlook": "Please see summary for details"
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from response: {str(e)}")
            return {
                "overall_sentiment": "NEUTRAL",
                "confidence_score": "5", 
                "investment_recommendation": "HOLD",
                "summary": "Analysis parsing failed: " + response[:500],
                "key_strengths": ["Analysis available"],
                "key_risks": ["Technical parsing error"],
                "fundamental_analysis": "Raw response: " + response[:200],
                "technical_outlook": "Please check raw response"
            }
        except Exception as e:
            logger.error(f"Error parsing analysis response: {str(e)}")
            return {
                "error": "Failed to parse analysis response",
                "details": str(e)
            }


# Example usage for testing
if __name__ == "__main__":
    analyzer = GroqStockAnalyzer()
    result = analyzer.analyze_stock("AAPL")
    print(json.dumps(result, indent=2)) 