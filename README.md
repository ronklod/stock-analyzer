# Stock Analyzer

A comprehensive stock analysis tool that provides technical analysis and news sentiment evaluation for stocks.

## Features

- Technical analysis with multiple indicators (RSI, MACD, Bollinger Bands, etc.)
- News sentiment analysis from multiple sources
- S&P 500, NASDAQ-100, and Magnificent 7 screeners
- Interactive web interface with charts and detailed analysis
- Watchlist functionality for tracking favorite stocks

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/stock-analyzer.git
   cd stock-analyzer
   ```

2. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up API keys:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your API keys:
     - Get Alpha Vantage API key from [alphavantage.co](https://www.alphavantage.co/)
     - Get News API key from [newsapi.org](https://newsapi.org/)
     - Get Finnhub API key from [finnhub.io](https://finnhub.io/)

   **Note:** News sentiment analysis requires at least one of these API keys to work properly!

## Usage

### Python API

```python
from stock_analysis.stock_analyzer import StockAnalyzer

# Initialize analyzer with a stock ticker
analyzer = StockAnalyzer("AAPL")

# Run analysis
analyzer.run_analysis()

# Get results
technical_score = analyzer.technical_score
news_sentiment = analyzer.news_sentiment
recommendation = analyzer.get_recommendation()
```