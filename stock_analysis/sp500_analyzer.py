#!/usr/bin/env python3
"""
S&P 500 Stock Screener
Analyzes all S&P 500 stocks and returns the most attractive ones
"""

import yfinance as yf
import pandas as pd
from stock_analysis.stock_analyzer import StockAnalyzer
from datetime import datetime
import concurrent.futures
import time

# S&P 500 stock symbols (as of 2024)
SP500_SYMBOLS = [
    'AAPL', 'MSFT', 'AMZN', 'NVDA', 'GOOGL', 'META', 'GOOG', 'BRK.B', 'UNH', 'XOM',
    'JPM', 'JNJ', 'V', 'PG', 'MA', 'HD', 'CVX', 'ABBV', 'MRK', 'LLY',
    'AVGO', 'PEP', 'KO', 'COST', 'CSCO', 'TMO', 'ABT', 'MCD', 'ACN', 'WMT',
    'BAC', 'CRM', 'DHR', 'PFE', 'ADBE', 'LIN', 'CMCSA', 'NKE', 'NEE', 'TXN',
    'VZ', 'PM', 'RTX', 'ORCL', 'UPS', 'HON', 'T', 'QCOM', 'INTC', 'BMY',
    'UNP', 'WFC', 'MS', 'AMGN', 'BA', 'LOW', 'INTU', 'COP', 'SPGI', 'GS',
    'BLK', 'AMD', 'CAT', 'DE', 'AMAT', 'AXP', 'ISRG', 'BKNG', 'SBUX', 'PLD',
    'MDLZ', 'ADI', 'TJX', 'GILD', 'MMC', 'CVS', 'CI', 'VRTX', 'SYK', 'C',
    'CB', 'REGN', 'DIS', 'BDX', 'EOG', 'SO', 'TMUS', 'MO', 'ZTS', 'LRCX',
    'CME', 'SCHW', 'PGR', 'AON', 'BSX', 'SLB', 'NOC', 'GE', 'ITW', 'CSX'
    # Note: This is a partial list. In production, you should include all 500 symbols
]

class SP500Screener:
    def __init__(self):
        self.results = []
        self.failed_symbols = []
        
    def analyze_stock(self, symbol):
        """Analyze a single stock and return its score"""
        try:
            print(f"Analyzing {symbol}...")
            analyzer = StockAnalyzer(symbol)
            
            # Fetch stock data
            if not analyzer.fetch_stock_data():
                return None
                
            # Calculate technical indicators
            analyzer.calculate_technical_indicators()
            
            # Get technical analysis
            tech_analysis = analyzer.analyze_technical_signals()
            
            # Get sentiment analysis
            analyzer.fetch_news_sentiment()
            
            # Generate recommendation
            recommendation = analyzer.generate_recommendation()
            
            # Get stock info
            info = analyzer.stock.info
            
            # Calculate additional metrics for ranking
            current_price = info.get('currentPrice', 0)
            fifty_two_week_low = info.get('fiftyTwoWeekLow', 0)
            fifty_two_week_high = info.get('fiftyTwoWeekHigh', 0)
            
            # Calculate position in 52-week range (0-100)
            if fifty_two_week_high > fifty_two_week_low:
                price_position = ((current_price - fifty_two_week_low) / 
                                (fifty_two_week_high - fifty_two_week_low)) * 100
            else:
                price_position = 50
            
            # Get volume metrics
            volume = info.get('volume', 0)
            avg_volume = info.get('averageVolume', 0)
            volume_ratio = volume / avg_volume if avg_volume > 0 else 1
            
            # Calculate momentum score
            if len(analyzer.df) >= 20:
                price_20d_ago = analyzer.df['Close'].iloc[-20]
                momentum_20d = ((current_price - price_20d_ago) / price_20d_ago) * 100
            else:
                momentum_20d = 0
                
            return {
                'symbol': symbol,
                'name': info.get('longName', symbol),
                'sector': info.get('sector', 'N/A'),
                'current_price': current_price,
                'market_cap': info.get('marketCap', 0),
                'pe_ratio': info.get('trailingPE', 0),
                'recommendation': recommendation['recommendation'],
                'combined_score': recommendation['combined_score'],
                'technical_score': recommendation['technical_score'],
                'sentiment_score': recommendation['sentiment_score'],
                'confidence': recommendation['confidence'],
                'price_position_52w': price_position,
                'volume_ratio': volume_ratio,
                'momentum_20d': momentum_20d,
                'description': analyzer.generate_recommendation_description(tech_analysis['signals'])
            }
            
        except Exception as e:
            print(f"Error analyzing {symbol}: {str(e)}")
            self.failed_symbols.append(symbol)
            return None
    
    def calculate_attractiveness_score(self, stock_data):
        """Calculate overall attractiveness score for ranking"""
        # Weighted scoring system
        score = 0
        
        # Combined score (40% weight)
        score += stock_data['combined_score'] * 0.4
        
        # Momentum (20% weight) - favor positive momentum
        if stock_data['momentum_20d'] > 0:
            score += min(stock_data['momentum_20d'], 20) * 0.2
        else:
            score += stock_data['momentum_20d'] * 0.1
        
        # Price position (15% weight) - favor stocks not at 52-week high
        if stock_data['price_position_52w'] < 80:  # Not near 52-week high
            score += (100 - stock_data['price_position_52w']) * 0.15
        else:
            score += (100 - stock_data['price_position_52w']) * 0.05
        
        # Volume ratio (10% weight) - favor higher than average volume
        if stock_data['volume_ratio'] > 1:
            score += min(stock_data['volume_ratio'] - 1, 1) * 10
        
        # Confidence (15% weight)
        score += stock_data['confidence'] * 0.15
        
        return score
    
    def screen_all_stocks(self, max_workers=10):
        """Screen all S&P 500 stocks in parallel"""
        print(f"Starting S&P 500 stock screening at {datetime.now()}")
        print(f"Analyzing {len(SP500_SYMBOLS)} stocks...\n")
        
        # Use ThreadPoolExecutor for parallel processing
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tasks
            future_to_symbol = {
                executor.submit(self.analyze_stock, symbol): symbol 
                for symbol in SP500_SYMBOLS
            }
            
            # Collect results as they complete
            for future in concurrent.futures.as_completed(future_to_symbol):
                result = future.result()
                if result:
                    result['attractiveness_score'] = self.calculate_attractiveness_score(result)
                    self.results.append(result)
        
        # Sort by attractiveness score
        self.results.sort(key=lambda x: x['attractiveness_score'], reverse=True)
        
        print(f"\nScreening completed. Successfully analyzed {len(self.results)} stocks.")
        if self.failed_symbols:
            print(f"Failed to analyze: {', '.join(self.failed_symbols)}")
        
        return self.results[:10]  # Return top 10
    
    def get_top_stocks(self, n=10):
        """Get top N stocks by attractiveness score"""
        return self.results[:n]
    
    def save_results(self, filename='sp500_screening_results.csv'):
        """Save results to CSV file"""
        if self.results:
            df = pd.DataFrame(self.results)
            df.to_csv(filename, index=False)
            print(f"\nResults saved to {filename}")

def main():
    """Main function for command-line usage"""
    screener = SP500Screener()
    
    # Screen all stocks
    top_stocks = screener.screen_all_stocks()
    
    # Display results
    print("\n" + "="*80)
    print("TOP 10 MOST ATTRACTIVE S&P 500 STOCKS")
    print("="*80 + "\n")
    
    for i, stock in enumerate(top_stocks, 1):
        print(f"{i}. {stock['symbol']} - {stock['name']}")
        print(f"   Sector: {stock['sector']}")
        print(f"   Current Price: ${stock['current_price']:.2f}")
        print(f"   Recommendation: {stock['recommendation']}")
        print(f"   Attractiveness Score: {stock['attractiveness_score']:.2f}")
        print(f"   Combined Score: {stock['combined_score']:.2f}")
        print(f"   20-Day Momentum: {stock['momentum_20d']:.2f}%")
        print(f"   Analysis: {stock['description']}")
        print()
    
    # Save results
    screener.save_results()

if __name__ == "__main__":
    main() 