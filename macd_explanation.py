#!/usr/bin/env python3
"""
MACD Indicator Explanation with Visual Example
"""

import yfinance as yf
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from ta.trend import MACD

def explain_macd(ticker='AAPL', period='3mo'):
    """
    Explain MACD indicator with a real example
    """
    print("\n" + "="*60)
    print("MACD (Moving Average Convergence Divergence) Explained")
    print("="*60)
    
    print("\n📊 What is MACD?")
    print("-" * 40)
    print("MACD is a momentum indicator that shows the relationship")
    print("between two moving averages of a stock's price.")
    
    print("\n🔢 The Math:")
    print("-" * 40)
    print("• MACD Line = 12-day EMA - 26-day EMA")
    print("• Signal Line = 9-day EMA of MACD")
    print("• Histogram = MACD - Signal")
    
    print("\n📈 Trading Signals:")
    print("-" * 40)
    print("BULLISH (Buy) Signals:")
    print("  ✅ MACD crosses ABOVE signal line")
    print("  ✅ MACD crosses ABOVE zero line")
    print("  ✅ Histogram turns positive")
    
    print("\nBEARISH (Sell) Signals:")
    print("  ❌ MACD crosses BELOW signal line")
    print("  ❌ MACD crosses BELOW zero line")
    print("  ❌ Histogram turns negative")
    
    # Fetch data
    print(f"\n📊 Let's see MACD in action with {ticker}...")
    stock = yf.Ticker(ticker)
    df = stock.history(period=period)
    
    # Calculate MACD
    macd = MACD(close=df['Close'])
    df['MACD'] = macd.macd()
    df['Signal'] = macd.macd_signal()
    df['Histogram'] = macd.macd_diff()
    
    # Find recent crossovers
    df['MACD_Signal_Cross'] = 0
    df.loc[df['MACD'] > df['Signal'], 'MACD_Signal_Cross'] = 1
    df.loc[df['MACD'] < df['Signal'], 'MACD_Signal_Cross'] = -1
    
    # Detect actual crossover points
    df['Crossover'] = df['MACD_Signal_Cross'].diff()
    
    # Create visualization
    fig = make_subplots(rows=2, cols=1, shared_xaxes=True,
                       vertical_spacing=0.03, 
                       row_heights=[0.6, 0.4],
                       subplot_titles=(f'{ticker} Price', 'MACD Indicator'))
    
    # Price chart
    fig.add_trace(go.Candlestick(x=df.index,
                                open=df['Open'],
                                high=df['High'],
                                low=df['Low'],
                                close=df['Close'],
                                name='Price'),
                 row=1, col=1)
    
    # Add buy/sell signals on price chart
    buy_signals = df[df['Crossover'] == 2]
    sell_signals = df[df['Crossover'] == -2]
    
    fig.add_trace(go.Scatter(x=buy_signals.index, 
                            y=buy_signals['Low'] * 0.98,
                            mode='markers',
                            marker=dict(symbol='triangle-up', size=15, color='green'),
                            name='Buy Signal'),
                 row=1, col=1)
    
    fig.add_trace(go.Scatter(x=sell_signals.index,
                            y=sell_signals['High'] * 1.02,
                            mode='markers',
                            marker=dict(symbol='triangle-down', size=15, color='red'),
                            name='Sell Signal'),
                 row=1, col=1)
    
    # MACD chart
    fig.add_trace(go.Scatter(x=df.index, y=df['MACD'], 
                            name='MACD', 
                            line=dict(color='blue', width=2)),
                 row=2, col=1)
    
    fig.add_trace(go.Scatter(x=df.index, y=df['Signal'], 
                            name='Signal', 
                            line=dict(color='red', width=2)),
                 row=2, col=1)
    
    fig.add_trace(go.Bar(x=df.index, y=df['Histogram'], 
                        name='Histogram',
                        marker_color='gray'),
                 row=2, col=1)
    
    # Add zero line
    fig.add_hline(y=0, line_dash="dash", line_color="black", row=2, col=1)
    
    # Update layout
    fig.update_layout(
        title=f'MACD Analysis for {ticker}',
        xaxis_rangeslider_visible=False,
        height=800,
        showlegend=True,
        template='plotly_white'
    )
    
    fig.update_xaxes(title_text="Date", row=2, col=1)
    fig.update_yaxes(title_text="Price ($)", row=1, col=1)
    fig.update_yaxes(title_text="MACD Value", row=2, col=1)
    
    # Show the chart
    fig.show()
    
    # Print recent signals
    print("\n📊 Recent MACD Signals:")
    print("-" * 40)
    
    recent_buys = buy_signals.tail(3)
    recent_sells = sell_signals.tail(3)
    
    if len(recent_buys) > 0:
        print("\nRecent BUY signals:")
        for date, row in recent_buys.iterrows():
            print(f"  📈 {date.strftime('%Y-%m-%d')}: Price ${row['Close']:.2f}")
    
    if len(recent_sells) > 0:
        print("\nRecent SELL signals:")
        for date, row in recent_sells.iterrows():
            print(f"  📉 {date.strftime('%Y-%m-%d')}: Price ${row['Close']:.2f}")
    
    # Current status
    latest = df.iloc[-1]
    print(f"\n📊 Current Status:")
    print(f"  MACD: {latest['MACD']:.3f}")
    print(f"  Signal: {latest['Signal']:.3f}")
    print(f"  Histogram: {latest['Histogram']:.3f}")
    
    if latest['MACD'] > latest['Signal']:
        print("  Status: BULLISH (MACD above Signal)")
    else:
        print("  Status: BEARISH (MACD below Signal)")
    
    print("\n💡 Key Takeaways:")
    print("-" * 40)
    print("1. MACD helps identify trend changes and momentum")
    print("2. Crossovers provide clear buy/sell signals")
    print("3. Histogram shows the strength of the trend")
    print("4. Works best in trending markets")
    print("5. Should be used with other indicators for confirmation")

if __name__ == "__main__":
    # You can change the ticker to analyze different stocks
    explain_macd('AAPL', period='3mo') 