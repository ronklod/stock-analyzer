#!/usr/bin/env python3
"""
Stock Analysis Program
Analyzes stocks using technical indicators and news sentiment
"""

import yfinance as yf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from ta import add_all_ta_features
from ta.utils import dropna
from ta.volatility import BollingerBands
from ta.trend import MACD, EMAIndicator, SMAIndicator, CCIIndicator
from ta.momentum import RSIIndicator, StochasticOscillator
from ta.volume import OnBalanceVolumeIndicator
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import requests
from textblob import TextBlob
import os
from dotenv import load_dotenv
import warnings
warnings.filterwarnings('ignore')
from demark_indicator import calculate_demark_indicator, prepare_demark_data

# Load environment variables
load_dotenv()

class StockAnalyzer:
    def __init__(self, ticker):
        self.ticker = ticker.upper()
        self.stock = yf.Ticker(self.ticker)
        self.df = None
        self.news_sentiment = 0
        self.technical_score = 0
        self.recommendation = None
        
    def fetch_stock_data(self, period="1y"):
        """Fetch historical stock data"""
        try:
            self.df = self.stock.history(period=period)
            if self.df.empty:
                raise ValueError(f"No data found for ticker {self.ticker}")
            return True
        except Exception as e:
            print(f"Error fetching stock data: {e}")
            return False
    
    def calculate_technical_indicators(self):
        """Calculate various technical indicators"""
        if self.df is None or self.df.empty:
            return False
        
        # Calculate moving averages
        self.df['SMA_20'] = SMAIndicator(close=self.df['Close'], window=20).sma_indicator()
        self.df['SMA_50'] = SMAIndicator(close=self.df['Close'], window=50).sma_indicator()
        self.df['SMA_150'] = SMAIndicator(close=self.df['Close'], window=150).sma_indicator()
        self.df['SMA_200'] = SMAIndicator(close=self.df['Close'], window=200).sma_indicator()
        self.df['EMA_12'] = EMAIndicator(close=self.df['Close'], window=12).ema_indicator()
        self.df['EMA_26'] = EMAIndicator(close=self.df['Close'], window=26).ema_indicator()
        
        # Drop NaN values from moving averages
        self.df['SMA_20'].fillna(method='bfill', inplace=True)
        self.df['SMA_50'].fillna(method='bfill', inplace=True)
        self.df['SMA_150'].fillna(method='bfill', inplace=True)
        self.df['SMA_200'].fillna(method='bfill', inplace=True)
        self.df['EMA_12'].fillna(method='bfill', inplace=True)
        self.df['EMA_26'].fillna(method='bfill', inplace=True)
        
        # RSI
        self.df['RSI'] = RSIIndicator(close=self.df['Close'], window=14).rsi()
        
        # MACD
        macd = MACD(close=self.df['Close'])
        self.df['MACD'] = macd.macd()
        self.df['MACD_signal'] = macd.macd_signal()
        self.df['MACD_diff'] = macd.macd_diff()
        
        # Bollinger Bands
        bb = BollingerBands(close=self.df['Close'], window=20, window_dev=2)
        self.df['BB_upper'] = bb.bollinger_hband()
        self.df['BB_middle'] = bb.bollinger_mavg()
        self.df['BB_lower'] = bb.bollinger_lband()
        
        # Stochastic Oscillator
        stoch = StochasticOscillator(high=self.df['High'], low=self.df['Low'], close=self.df['Close'])
        self.df['Stoch_K'] = stoch.stoch()
        self.df['Stoch_D'] = stoch.stoch_signal()
        
        # On Balance Volume
        self.df['OBV'] = OnBalanceVolumeIndicator(close=self.df['Close'], volume=self.df['Volume']).on_balance_volume()
        
        # CCI (Commodity Channel Index)
        self.df['CCI'] = CCIIndicator(high=self.df['High'], low=self.df['Low'], close=self.df['Close'], window=20).cci()
        
        # Demark Indicator
        self.df = calculate_demark_indicator(self.df)
        
        return True
    
    def analyze_technical_signals(self):
        """Analyze technical indicators and generate signals"""
        if self.df is None:
            return {"score": 0, "signals": {}}
        
        # Check if we have enough data
        if len(self.df) < 20:
            print(f"  Note: Limited historical data ({len(self.df)} days). Some indicators may not be available.")
            return {"score": 0, "signals": {"Status": "Insufficient data for full analysis"}}
        
        latest = self.df.iloc[-1]
        signals = {}
        bullish_count = 0
        bearish_count = 0
        
        # Price vs Moving Averages
        if pd.notna(latest.get('SMA_20', None)):
            if latest['Close'] > latest['SMA_20']:
                signals['SMA_20'] = 'Bullish'
                bullish_count += 1
            else:
                signals['SMA_20'] = 'Bearish'
                bearish_count += 1
        
        if pd.notna(latest.get('SMA_50', None)):
            if latest['Close'] > latest['SMA_50']:
                signals['SMA_50'] = 'Bullish'
                bullish_count += 1
            else:
                signals['SMA_50'] = 'Bearish'
                bearish_count += 1
        
        if pd.notna(latest.get('SMA_150', None)) and latest['SMA_150'] > 0:
            if latest['Close'] > latest['SMA_150']:
                signals['SMA_150'] = 'Bullish'
                bullish_count += 1.5  # Medium-term trend
            else:
                signals['SMA_150'] = 'Bearish'
                bearish_count += 1.5
        
        if pd.notna(latest.get('SMA_200', None)) and latest['SMA_200'] > 0:
            if latest['Close'] > latest['SMA_200']:
                signals['SMA_200'] = 'Bullish'
                bullish_count += 2  # Long-term trend is more important
            else:
                signals['SMA_200'] = 'Bearish'
                bearish_count += 2
        
        # RSI Analysis
        if pd.notna(latest.get('RSI', None)):
            if latest['RSI'] < 30:
                signals['RSI'] = 'Oversold (Bullish)'
                bullish_count += 2
            elif latest['RSI'] > 70:
                signals['RSI'] = 'Overbought (Bearish)'
                bearish_count += 2
            else:
                signals['RSI'] = f'Neutral ({latest["RSI"]:.1f})'
            
        # MACD Analysis
        if pd.notna(latest.get('MACD', None)) and pd.notna(latest.get('MACD_signal', None)):
            if latest['MACD'] > latest['MACD_signal']:
                signals['MACD'] = 'Bullish'
                bullish_count += 1
            else:
                signals['MACD'] = 'Bearish'
                bearish_count += 1
            
        # Bollinger Bands
        if pd.notna(latest.get('BB_lower', None)) and pd.notna(latest.get('BB_upper', None)):
            if latest['Close'] < latest['BB_lower']:
                signals['Bollinger_Bands'] = 'Oversold (Bullish)'
                bullish_count += 1
            elif latest['Close'] > latest['BB_upper']:
                signals['Bollinger_Bands'] = 'Overbought (Bearish)'
                bearish_count += 1
            else:
                signals['Bollinger_Bands'] = 'Neutral'
        
        # CCI Analysis
        if pd.notna(latest.get('CCI', None)):
            if latest['CCI'] < -100:
                signals['CCI'] = 'Oversold (Bullish)'
                bullish_count += 1.5
            elif latest['CCI'] > 100:
                signals['CCI'] = 'Overbought (Bearish)'
                bearish_count += 1.5
            else:
                signals['CCI'] = f'Neutral ({latest["CCI"]:.1f})'
        
        # Calculate technical score (-100 to 100)
        total_signals = bullish_count + bearish_count
        if total_signals > 0:
            self.technical_score = ((bullish_count - bearish_count) / total_signals) * 100
        else:
            self.technical_score = 0
            
        return {"score": self.technical_score, "signals": signals}
    
    def fetch_news_sentiment(self):
        """Fetch and analyze news sentiment from major financial news sources"""
        sentiments = []
        news_sources = []
        news_articles = []  # Store news articles
        
        # 1. Using Alpha Vantage News API (if API key is available)
        alpha_vantage_key = os.getenv('ALPHA_VANTAGE_KEY')
        if alpha_vantage_key:
            try:
                url = f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers={self.ticker}&apikey={alpha_vantage_key}"
                response = requests.get(url)
                if response.status_code == 200:
                    data = response.json()
                    feed = data.get('feed', [])
                    for article in feed[:10]:
                        sentiment_score = float(article.get('overall_sentiment_score', 0))
                        sentiments.append(sentiment_score * 2 - 1)  # Convert 0-1 scale to -1 to 1
                        source = article.get('source', '')
                        if source:
                            news_sources.append(source)
                        # Store article info
                        news_articles.append({
                            'title': article.get('title', ''),
                            'url': article.get('url', ''),
                            'source': source,
                            'sentiment': sentiment_score * 2 - 1,
                            'date': article.get('time_published', ''),
                            'summary': article.get('summary', '')
                        })
            except Exception as e:
                print(f"Alpha Vantage API error: {str(e)}")

        # 2. Using NewsAPI (targeting financial sources)
        newsapi_key = os.getenv('NEWSAPI_KEY')
        if newsapi_key:
            try:
                financial_sources = 'bloomberg.com,cnbc.com,reuters.com,ft.com,wsj.com,marketwatch.com,fool.com,seekingalpha.com,investing.com'
                url = f"https://newsapi.org/v2/everything?q={self.ticker}&apiKey={newsapi_key}&domains={financial_sources}&pageSize=20&sortBy=publishedAt&language=en"
                response = requests.get(url)
                if response.status_code == 200:
                    articles = response.json().get('articles', [])
                    for article in articles[:10]:
                        title = article.get('title', '')
                        description = article.get('description', '')
                        source = article.get('source', {}).get('name', '')
                        
                        if source:
                            news_sources.append(source)
                        
                        text = f"{title} {description}"
                        if text:
                            blob = TextBlob(text)
                            sentiment = blob.sentiment.polarity
                            weight = 1.2 if any(fs in source.lower() for fs in ['bloomberg', 'cnbc', 'reuters', 'wsj']) else 1.0
                            sentiments.append(sentiment * weight)
                            # Store article info
                            news_articles.append({
                                'title': title,
                                'url': article.get('url', ''),
                                'source': source,
                                'sentiment': sentiment,
                                'date': article.get('publishedAt', ''),
                                'summary': description
                            })
            except Exception as e:
                print(f"NewsAPI error: {str(e)}")

        # 3. Using Finnhub (if API key is available)
        finnhub_key = os.getenv('FINNHUB_API_KEY')
        if finnhub_key:
            try:
                import finnhub
                finnhub_client = finnhub.Client(api_key=finnhub_key)
                news = finnhub_client.company_news(
                    self.ticker, 
                    _from=datetime.now().date() - timedelta(days=7),
                    to=datetime.now().date()
                )
                for article in news[:10]:
                    headline = article.get('headline', '')
                    summary = article.get('summary', '')
                    source = article.get('source', '')
                    
                    if source:
                        news_sources.append(source)
                    
                    text = f"{headline} {summary}"
                    if text:
                        blob = TextBlob(text)
                        sentiment = blob.sentiment.polarity
                        days_old = (datetime.now() - datetime.fromtimestamp(article.get('datetime', 0))).days
                        recency_weight = 1.2 if days_old <= 2 else 1.0
                        sentiments.append(sentiment * recency_weight)
                        # Store article info
                        news_articles.append({
                            'title': headline,
                            'url': article.get('url', ''),
                            'source': source,
                            'sentiment': sentiment,
                            'date': datetime.fromtimestamp(article.get('datetime', 0)).isoformat(),
                            'summary': summary
                        })
            except Exception as e:
                print(f"Finnhub API error: {str(e)}")

        # 4. Using Yahoo Finance news (no API key required)
        try:
            news = self.stock.news
            for article in news[:10]:
                title = article.get('title', '')
                source = article.get('publisher', '')
                
                if source:
                    news_sources.append(source)
                
                if title:
                    blob = TextBlob(title)
                    sentiment = blob.sentiment.polarity
                    sentiments.append(sentiment)
                    # Store article info
                    news_articles.append({
                        'title': title,
                        'url': article.get('link', ''),
                        'source': source,
                        'sentiment': sentiment,
                        'date': datetime.fromtimestamp(article.get('providerPublishTime', 0)).isoformat(),
                        'summary': article.get('summary', '')
                    })
        except Exception as e:
            print(f"Yahoo Finance news error: {str(e)}")

        # Calculate weighted sentiment score
        if sentiments:
            unique_sources = len(set(news_sources))
            source_diversity_bonus = min(unique_sources / 5, 1) * 0.1
            base_sentiment = np.mean(sentiments)
            self.news_sentiment = (base_sentiment * (1 + source_diversity_bonus)) * 100
        else:
            self.news_sentiment = 0
            
        # Sort articles by absolute sentiment value (most impactful first)
        news_articles.sort(key=lambda x: abs(x['sentiment']), reverse=True)
        
        # Store the articles for access in other methods
        self.news_articles = news_articles[:10]  # Keep top 10 most impactful articles
            
        return self.news_sentiment
    
    def create_interactive_chart(self):
        """Create interactive chart with technical indicators"""
        fig = make_subplots(rows=4, cols=1, shared_xaxes=True,
                           vertical_spacing=0.03,
                           row_heights=[0.5, 0.2, 0.15, 0.15],
                           subplot_titles=('Price & Moving Averages', 'Volume', 'RSI', 'MACD'))
        
        # Candlestick chart
        fig.add_trace(go.Candlestick(x=self.df.index,
                                    open=self.df['Open'],
                                    high=self.df['High'],
                                    low=self.df['Low'],
                                    close=self.df['Close'],
                                    name='Price'),
                     row=1, col=1)
        
        # Moving averages
        fig.add_trace(go.Scatter(x=self.df.index, y=self.df['SMA_20'], name='SMA 20', line=dict(color='orange', width=1)), row=1, col=1)
        fig.add_trace(go.Scatter(x=self.df.index, y=self.df['SMA_50'], name='SMA 50', line=dict(color='blue', width=1)), row=1, col=1)
        if 'SMA_200' in self.df.columns and not self.df['SMA_200'].isna().all():
            fig.add_trace(go.Scatter(x=self.df.index, y=self.df['SMA_200'], name='SMA 200', line=dict(color='red', width=1)), row=1, col=1)
        
        # Bollinger Bands
        fig.add_trace(go.Scatter(x=self.df.index, y=self.df['BB_upper'], name='BB Upper', line=dict(color='gray', width=1, dash='dash')), row=1, col=1)
        fig.add_trace(go.Scatter(x=self.df.index, y=self.df['BB_lower'], name='BB Lower', line=dict(color='gray', width=1, dash='dash')), row=1, col=1)
        
        # Volume
        colors = ['red' if self.df['Close'].iloc[i] < self.df['Open'].iloc[i] else 'green' for i in range(len(self.df))]
        fig.add_trace(go.Bar(x=self.df.index, y=self.df['Volume'], name='Volume', marker_color=colors), row=2, col=1)
        
        # RSI
        fig.add_trace(go.Scatter(x=self.df.index, y=self.df['RSI'], name='RSI', line=dict(color='purple')), row=3, col=1)
        fig.add_hline(y=70, line_dash="dash", line_color="red", row=3, col=1)
        fig.add_hline(y=30, line_dash="dash", line_color="green", row=3, col=1)
        
        # MACD
        fig.add_trace(go.Scatter(x=self.df.index, y=self.df['MACD'], name='MACD', line=dict(color='blue')), row=4, col=1)
        fig.add_trace(go.Scatter(x=self.df.index, y=self.df['MACD_signal'], name='Signal', line=dict(color='red')), row=4, col=1)
        fig.add_trace(go.Bar(x=self.df.index, y=self.df['MACD_diff'], name='MACD Diff'), row=4, col=1)
        
        # Update layout
        fig.update_layout(
            title=f'{self.ticker} Technical Analysis',
            xaxis_rangeslider_visible=False,
            height=1000,
            showlegend=True,
            template='plotly_dark'
        )
        
        fig.update_xaxes(title_text="Date", row=4, col=1)
        fig.update_yaxes(title_text="Price", row=1, col=1)
        fig.update_yaxes(title_text="Volume", row=2, col=1)
        fig.update_yaxes(title_text="RSI", row=3, col=1)
        fig.update_yaxes(title_text="MACD", row=4, col=1)
        
        return fig
    
    def generate_recommendation(self):
        """Generate final buy/sell recommendation"""
        # Combine technical and sentiment scores
        total_score = (self.technical_score * 0.7) + (self.news_sentiment * 0.3)
        
        if total_score > 30:
            self.recommendation = "STRONG BUY"
            confidence = min(total_score, 100)
        elif total_score > 10:
            self.recommendation = "BUY"
            confidence = min(total_score, 100)
        elif total_score < -30:
            self.recommendation = "STRONG SELL"
            confidence = min(abs(total_score), 100)
        elif total_score < -10:
            self.recommendation = "SELL"
            confidence = min(abs(total_score), 100)
        else:
            self.recommendation = "HOLD"
            confidence = 100 - abs(total_score)
            
        return {
            "recommendation": self.recommendation,
            "confidence": confidence,
            "technical_score": self.technical_score,
            "sentiment_score": self.news_sentiment,
            "combined_score": total_score
        }
    
    def generate_recommendation_description(self, tech_signals):
        """Generate a detailed description for the recommendation"""
        descriptions = []
        latest = self.df.iloc[-1] if self.df is not None and len(self.df) > 0 else None
        
        # Technical analysis description
        if self.technical_score > 20:
            descriptions.append("Strong technical indicators suggest bullish momentum")
        elif self.technical_score > 0:
            descriptions.append("Technical indicators are moderately bullish")
        elif self.technical_score < -20:
            descriptions.append("Technical indicators show bearish signals")
        elif self.technical_score < 0:
            descriptions.append("Technical indicators are slightly bearish")
        else:
            descriptions.append("Technical indicators are neutral")
        
        # Specific indicator insights
        key_points = []
        
        # Moving average analysis
        ma_bullish = 0
        ma_bearish = 0
        for ma in ['SMA_20', 'SMA_50', 'SMA_150', 'SMA_200']:
            if ma in tech_signals:
                if 'Bullish' in tech_signals[ma]:
                    ma_bullish += 1
                else:
                    ma_bearish += 1
        
        if ma_bullish > ma_bearish:
            key_points.append(f"price is above {ma_bullish} key moving averages")
        elif ma_bearish > ma_bullish:
            key_points.append(f"price is below {ma_bearish} key moving averages")
        
        # RSI analysis
        if 'RSI' in tech_signals:
            if 'Oversold' in tech_signals['RSI']:
                key_points.append("RSI indicates oversold conditions (potential bounce)")
            elif 'Overbought' in tech_signals['RSI']:
                key_points.append("RSI shows overbought conditions (potential pullback)")
        
        # MACD analysis
        if 'MACD' in tech_signals:
            if tech_signals['MACD'] == 'Bullish':
                key_points.append("MACD shows bullish crossover")
            else:
                key_points.append("MACD shows bearish crossover")
        
        # Bollinger Bands
        if 'Bollinger_Bands' in tech_signals:
            if 'Oversold' in tech_signals['Bollinger_Bands']:
                key_points.append("price touched lower Bollinger Band (oversold)")
            elif 'Overbought' in tech_signals['Bollinger_Bands']:
                key_points.append("price touched upper Bollinger Band (overbought)")
        
        if key_points:
            descriptions.append("Key factors: " + ", ".join(key_points))
        
        # Sentiment analysis description
        if self.news_sentiment > 20:
            descriptions.append("News sentiment is strongly positive")
        elif self.news_sentiment > 0:
            descriptions.append("News sentiment is slightly positive")
        elif self.news_sentiment < -20:
            descriptions.append("News sentiment is strongly negative")
        elif self.news_sentiment < 0:
            descriptions.append("News sentiment is slightly negative")
        else:
            descriptions.append("News sentiment is neutral")
        
        # Price trend description
        if latest is not None and pd.notna(latest.get('SMA_20', None)):
            price_vs_sma20 = ((latest['Close'] - latest['SMA_20']) / latest['SMA_20']) * 100
            if abs(price_vs_sma20) > 5:
                if price_vs_sma20 > 0:
                    descriptions.append(f"Price is {price_vs_sma20:.1f}% above 20-day average")
                else:
                    descriptions.append(f"Price is {abs(price_vs_sma20):.1f}% below 20-day average")
        
        return ". ".join(descriptions) + "."
    
    def run_analysis(self):
        """Run complete analysis"""
        print(f"\n{'='*60}")
        print(f"Analyzing {self.ticker}...")
        print(f"{'='*60}\n")
        
        # Fetch stock data
        if not self.fetch_stock_data():
            return False
        
        # Get company info
        try:
            info = self.stock.info
            print(f"Company: {info.get('longName', 'N/A')}")
            print(f"Sector: {info.get('sector', 'N/A')}")
            print(f"Current Price: ${info.get('currentPrice', 'N/A')}")
            print(f"52 Week Range: ${info.get('fiftyTwoWeekLow', 'N/A')} - ${info.get('fiftyTwoWeekHigh', 'N/A')}")
            print(f"Market Cap: ${info.get('marketCap', 0):,.0f}")
            print()
        except:
            pass
        
        # Calculate technical indicators
        self.calculate_technical_indicators()
        
        # Analyze technical signals
        tech_analysis = self.analyze_technical_signals()
        print("Technical Analysis:")
        print(f"Technical Score: {tech_analysis['score']:.1f}/100")
        print("\nIndicator Signals:")
        for indicator, signal in tech_analysis['signals'].items():
            print(f"  {indicator}: {signal}")
        
        # Analyze news sentiment
        print(f"\nNews Sentiment Analysis:")
        self.fetch_news_sentiment()
        if self.news_sentiment > 0:
            print(f"Sentiment Score: {self.news_sentiment:.1f}/100 (Positive)")
        elif self.news_sentiment < 0:
            print(f"Sentiment Score: {self.news_sentiment:.1f}/100 (Negative)")
        else:
            print(f"Sentiment Score: {self.news_sentiment:.1f}/100 (Neutral)")
        
        # Generate recommendation
        rec = self.generate_recommendation()
        print(f"\n{'='*60}")
        print(f"RECOMMENDATION: {rec['recommendation']}")
        print(f"Confidence: {rec['confidence']:.1f}%")
        print(f"{'='*60}\n")
        
        # Create and show chart
        fig = self.create_interactive_chart()
        fig.show()
        
        return True

def main():
    """Main function"""
    print("\n" + "="*60)
    print("STOCK ANALYSIS PROGRAM")
    print("="*60)
    print("\nThis program analyzes stocks using technical indicators")
    print("and news sentiment to provide buy/sell recommendations.\n")
    
    while True:
        ticker = input("Enter stock ticker (or 'quit' to exit): ").strip()
        
        if ticker.lower() == 'quit':
            print("\nThank you for using Stock Analyzer!")
            break
            
        if not ticker:
            print("Please enter a valid ticker symbol.")
            continue
        
        analyzer = StockAnalyzer(ticker)
        
        try:
            if analyzer.run_analysis():
                print("\nAnalysis complete!")
            else:
                print(f"\nFailed to analyze {ticker}. Please check the ticker symbol.")
        except Exception as e:
            print(f"\nError during analysis: {e}")
            print("Please try again with a different ticker.")
        
        print("\n" + "-"*60 + "\n")

if __name__ == "__main__":
    main() 