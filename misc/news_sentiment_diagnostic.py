#!/usr/bin/env python3
"""
News Sentiment Diagnostic Script
This script helps diagnose issues with the news sentiment functionality
"""

import os
from pathlib import Path
from dotenv import load_dotenv
import requests
import sys

def check_env_file():
    """Check if .env file exists and has required keys"""
    dotenv_path = Path('.env')
    
    if not dotenv_path.exists():
        print("❌ .env file not found!")
        print("   Create a .env file in the project root with your API keys.")
        print("   Use .env.example as a template.")
        return False
    
    # Load environment variables
    load_dotenv()
    
    # Check for required API keys
    keys_found = 0
    
    alpha_vantage_key = os.getenv('ALPHA_VANTAGE_KEY')
    if alpha_vantage_key and alpha_vantage_key.strip():
        print(f"✅ ALPHA_VANTAGE_KEY found: {alpha_vantage_key[:4]}{'*' * (len(alpha_vantage_key) - 8)}{alpha_vantage_key[-4:]}")
        keys_found += 1
    else:
        print("❌ ALPHA_VANTAGE_KEY not found or empty")
    
    newsapi_key = os.getenv('NEWSAPI_KEY')
    if newsapi_key and newsapi_key.strip():
        print(f"✅ NEWSAPI_KEY found: {newsapi_key[:4]}{'*' * (len(newsapi_key) - 8)}{newsapi_key[-4:]}")
        keys_found += 1
    else:
        print("❌ NEWSAPI_KEY not found or empty")
    
    finnhub_key = os.getenv('FINNHUB_API_KEY')
    if finnhub_key and finnhub_key.strip():
        print(f"✅ FINNHUB_API_KEY found: {finnhub_key[:4]}{'*' * (len(finnhub_key) - 8)}{finnhub_key[-4:]}")
        keys_found += 1
    else:
        print("❌ FINNHUB_API_KEY not found or empty")
    
    return keys_found > 0

def check_packages():
    """Check if required packages are installed"""
    required_packages = ['textblob', 'newsapi', 'finnhub']
    all_installed = True
    
    for package in required_packages:
        try:
            if package == 'newsapi':
                # Special case for newsapi-python package
                from newsapi import NewsApiClient
                print(f"✅ {package} installed successfully")
            elif package == 'finnhub':
                # Special case for finnhub-python package
                import finnhub
                print(f"✅ {package} installed successfully")
            else:
                # General case
                __import__(package)
                print(f"✅ {package} installed successfully")
        except ImportError:
            print(f"❌ {package} not installed! Run: pip install {package}")
            all_installed = False
    
    return all_installed

def test_apis(ticker="AAPL"):
    """Test each API to ensure they return data"""
    print("\nTesting APIs with ticker:", ticker)
    
    # Test Alpha Vantage
    alpha_vantage_key = os.getenv('ALPHA_VANTAGE_KEY')
    if alpha_vantage_key and alpha_vantage_key.strip():
        try:
            url = f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers={ticker}&apikey={alpha_vantage_key}"
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                if 'feed' in data:
                    print(f"✅ Alpha Vantage API response successful - found {len(data['feed'])} news items")
                else:
                    print("⚠️ Alpha Vantage API responded but no news feed found. Response:")
                    print(data)
            else:
                print(f"❌ Alpha Vantage API error: Status code {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"❌ Alpha Vantage API error: {str(e)}")
    
    # Test NewsAPI
    newsapi_key = os.getenv('NEWSAPI_KEY')
    if newsapi_key and newsapi_key.strip():
        try:
            financial_sources = 'bloomberg.com,cnbc.com,reuters.com,ft.com,wsj.com,marketwatch.com'
            url = f"https://newsapi.org/v2/everything?q={ticker}&apiKey={newsapi_key}&domains={financial_sources}&pageSize=10&sortBy=publishedAt&language=en"
            response = requests.get(url)
            if response.status_code == 200:
                data = response.json()
                if 'articles' in data:
                    print(f"✅ NewsAPI response successful - found {len(data['articles'])} articles")
                else:
                    print("⚠️ NewsAPI responded but no articles found. Response:")
                    print(data)
            else:
                print(f"❌ NewsAPI error: Status code {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"❌ NewsAPI error: {str(e)}")
    
    # Test Finnhub
    finnhub_key = os.getenv('FINNHUB_API_KEY')
    if finnhub_key and finnhub_key.strip():
        try:
            import finnhub
            finnhub_client = finnhub.Client(api_key=finnhub_key)
            
            from datetime import datetime, timedelta
            news = finnhub_client.company_news(
                ticker, 
                _from=(datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"),
                to=datetime.now().strftime("%Y-%m-%d")
            )
            
            if news:
                print(f"✅ Finnhub API response successful - found {len(news)} news items")
            else:
                print("⚠️ Finnhub API responded but no news found")
        except Exception as e:
            print(f"❌ Finnhub API error: {str(e)}")
            
    # Test Yahoo Finance (built-in to yfinance)
    try:
        import yfinance as yf
        stock = yf.Ticker(ticker)
        news = stock.news
        if news:
            print(f"✅ Yahoo Finance news successful - found {len(news)} news items")
        else:
            print("⚠️ Yahoo Finance returned no news items")
    except Exception as e:
        print(f"❌ Yahoo Finance news error: {str(e)}")

def main():
    print("==== Stock Analyzer News Sentiment Diagnostic ====\n")
    
    # Check for environment variables
    print("Checking environment variables...")
    env_ok = check_env_file()
    
    # Check for required packages
    print("\nChecking required packages...")
    packages_ok = check_packages()
    
    # Run API tests
    ticker = "AAPL"
    if len(sys.argv) > 1:
        ticker = sys.argv[1]
    
    if env_ok and packages_ok:
        test_apis(ticker)
    
    # Print summary
    print("\n==== Summary ====")
    if not env_ok:
        print("❌ Environment setup incomplete - Add your API keys to .env file")
    if not packages_ok:
        print("❌ Missing required packages - Install them with pip")
    if env_ok and packages_ok:
        print("✅ Basic setup looks good!")
        print("NOTE: If you still have issues, check that your API keys are valid and not expired")
    
    print("\nTo fix news sentiment functionality:")
    print("1. Sign up for API keys at:")
    print("   - Alpha Vantage: https://www.alphavantage.co/")
    print("   - NewsAPI: https://newsapi.org/")
    print("   - Finnhub: https://finnhub.io/")
    print("2. Add your API keys to the .env file")
    print("3. Ensure all dependencies are installed: pip install -r requirements.txt")

if __name__ == "__main__":
    main()
