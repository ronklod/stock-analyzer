#!/usr/bin/env python3
"""
Demo of the Stock Analyzer
"""

from stock_analysis.stock_analyzer import StockAnalyzer

def demo():
    print("\n" + "="*60)
    print("STOCK ANALYZER DEMO")
    print("="*60)
    
    # Analyze Apple stock
    ticker = 'AAPL'
    print(f"\nAnalyzing {ticker} with 6 months of historical data...")
    
    analyzer = StockAnalyzer(ticker)
    analyzer.run_analysis()
    
    print("\nTip: The program works best with stocks that have:")
    print("- At least 200 days of trading history for all indicators")
    print("- Active news coverage for sentiment analysis")
    print("- API keys in .env file for enhanced news analysis")

if __name__ == "__main__":
    demo() 