#!/usr/bin/env python3
"""
Example usage of the Stock Analyzer
"""

from stock_analyzer import StockAnalyzer

def analyze_multiple_stocks():
    """Example: Analyze multiple stocks"""
    tickers = ['AAPL', 'GOOGL', 'MSFT', 'TSLA']
    
    results = {}
    
    for ticker in tickers:
        print(f"\nAnalyzing {ticker}...")
        analyzer = StockAnalyzer(ticker)
        
        if analyzer.fetch_stock_data():
            analyzer.calculate_technical_indicators()
            tech_analysis = analyzer.analyze_technical_signals()
            analyzer.fetch_news_sentiment()
            recommendation = analyzer.generate_recommendation()
            
            results[ticker] = {
                'technical_score': tech_analysis['score'],
                'sentiment_score': analyzer.news_sentiment,
                'recommendation': recommendation['recommendation'],
                'confidence': recommendation['confidence']
            }
    
    # Display summary
    print("\n" + "="*60)
    print("ANALYSIS SUMMARY")
    print("="*60)
    
    for ticker, result in results.items():
        print(f"\n{ticker}:")
        print(f"  Technical Score: {result['technical_score']:.1f}")
        print(f"  Sentiment Score: {result['sentiment_score']:.1f}")
        print(f"  Recommendation: {result['recommendation']}")
        print(f"  Confidence: {result['confidence']:.1f}%")

def analyze_single_stock_detailed():
    """Example: Detailed analysis of a single stock"""
    ticker = 'AAPL'
    analyzer = StockAnalyzer(ticker)
    
    # Run full analysis
    analyzer.run_analysis()

if __name__ == "__main__":
    # Example 1: Analyze multiple stocks
    # analyze_multiple_stocks()
    
    # Example 2: Detailed analysis of single stock
    analyze_single_stock_detailed() 