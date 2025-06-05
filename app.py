#!/usr/bin/env python3
"""
Flask API server for Stock Analyzer
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import base64
from io import BytesIO
import plotly.graph_objects as go
from stock_analyzer import StockAnalyzer
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

@app.route('/api/analyze', methods=['POST'])
def analyze_stock():
    """
    Analyze a stock and return results
    """
    try:
        data = request.get_json()
        ticker = data.get('ticker', '').upper()
        
        if not ticker:
            return jsonify({'error': 'Ticker symbol is required'}), 400
        
        logger.info(f"Analyzing stock: {ticker}")
        
        # Create analyzer instance
        analyzer = StockAnalyzer(ticker)
        
        # Fetch stock data
        if not analyzer.fetch_stock_data():
            return jsonify({'error': f'Failed to fetch data for {ticker}. Please check the ticker symbol.'}), 404
        
        # Get company info
        try:
            info = analyzer.stock.info
            company_info = {
                'name': info.get('longName', 'N/A'),
                'sector': info.get('sector', 'N/A'),
                'currentPrice': info.get('currentPrice', 0),
                'previousClose': info.get('previousClose', 0),
                'dayChange': info.get('currentPrice', 0) - info.get('previousClose', 0) if info.get('currentPrice') and info.get('previousClose') else 0,
                'dayChangePercent': ((info.get('currentPrice', 0) - info.get('previousClose', 0)) / info.get('previousClose', 1) * 100) if info.get('previousClose') else 0,
                'fiftyTwoWeekLow': info.get('fiftyTwoWeekLow', 0),
                'fiftyTwoWeekHigh': info.get('fiftyTwoWeekHigh', 0),
                'marketCap': info.get('marketCap', 0),
                'volume': info.get('volume', 0),
                'averageVolume': info.get('averageVolume', 0),
                'pe': info.get('trailingPE', 0),
                'eps': info.get('trailingEps', 0),
                'dividend': info.get('dividendYield', 0) * 100 if info.get('dividendYield') else 0
            }
        except:
            company_info = {
                'name': ticker,
                'sector': 'N/A',
                'currentPrice': analyzer.df['Close'].iloc[-1] if len(analyzer.df) > 0 else 0
            }
        
        # Calculate technical indicators
        analyzer.calculate_technical_indicators()
        
        # Analyze technical signals
        tech_analysis = analyzer.analyze_technical_signals()
        
        # Analyze news sentiment
        analyzer.fetch_news_sentiment()
        
        # Generate recommendation
        recommendation = analyzer.generate_recommendation()
        
        # Create chart data
        chart_data = create_chart_data(analyzer)
        
        # Prepare response
        response = {
            'ticker': ticker,
            'companyInfo': company_info,
            'technicalAnalysis': {
                'score': tech_analysis['score'],
                'signals': tech_analysis['signals']
            },
            'sentimentAnalysis': {
                'score': analyzer.news_sentiment,
                'description': 'Positive' if analyzer.news_sentiment > 0 else 'Negative' if analyzer.news_sentiment < 0 else 'Neutral'
            },
            'recommendation': recommendation,
            'chartData': chart_data,
            'latestData': {
                'close': float(analyzer.df['Close'].iloc[-1]),
                'volume': int(analyzer.df['Volume'].iloc[-1]),
                'rsi': float(analyzer.df['RSI'].iloc[-1]) if 'RSI' in analyzer.df.columns else None,
                'sma20': float(analyzer.df['SMA_20'].iloc[-1]) if 'SMA_20' in analyzer.df.columns else None,
                'sma50': float(analyzer.df['SMA_50'].iloc[-1]) if 'SMA_50' in analyzer.df.columns else None,
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error analyzing stock: {str(e)}")
        return jsonify({'error': str(e)}), 500

def create_chart_data(analyzer):
    """
    Create chart data for frontend visualization
    """
    df = analyzer.df.copy()
    df.index = df.index.strftime('%Y-%m-%d')
    
    # Prepare data for charts
    chart_data = {
        'dates': df.index.tolist(),
        'ohlc': {
            'open': df['Open'].tolist(),
            'high': df['High'].tolist(),
            'low': df['Low'].tolist(),
            'close': df['Close'].tolist()
        },
        'volume': df['Volume'].tolist(),
        'indicators': {}
    }
    
    # Add technical indicators if available
    if 'SMA_20' in df.columns:
        chart_data['indicators']['sma20'] = df['SMA_20'].tolist()
    if 'SMA_50' in df.columns:
        chart_data['indicators']['sma50'] = df['SMA_50'].tolist()
    if 'SMA_200' in df.columns:
        chart_data['indicators']['sma200'] = df['SMA_200'].tolist()
    if 'BB_upper' in df.columns:
        chart_data['indicators']['bbUpper'] = df['BB_upper'].tolist()
    if 'BB_lower' in df.columns:
        chart_data['indicators']['bbLower'] = df['BB_lower'].tolist()
    if 'RSI' in df.columns:
        chart_data['indicators']['rsi'] = df['RSI'].tolist()
    if 'MACD' in df.columns:
        chart_data['indicators']['macd'] = df['MACD'].tolist()
    if 'MACD_signal' in df.columns:
        chart_data['indicators']['macdSignal'] = df['MACD_signal'].tolist()
    if 'MACD_diff' in df.columns:
        chart_data['indicators']['macdHist'] = df['MACD_diff'].tolist()
    
    return chart_data

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Stock Analyzer API is running'})

if __name__ == '__main__':
    app.run(debug=True, port=5001) 