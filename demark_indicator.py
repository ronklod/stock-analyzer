#!/usr/bin/env python3
"""
Demark Indicator Implementation

This module implements Tom Demark's Sequential Indicator, which is used
to identify potential price exhaustion points and trend reversals.
"""

import pandas as pd
import numpy as np

def calculate_demark_indicator(df):
    """
    Calculate Tom Demark's Sequential Indicator
    
    Returns both setup and countdown values along with buy/sell signals
    
    Args:
        df: DataFrame with OHLC price data
        
    Returns:
        DataFrame with Demark indicator columns added
    """
    if df is None or len(df) < 13:
        print("Warning: Insufficient data for Demark indicator calculation")
        return df
    
    # Deep copy the dataframe to avoid modifying the original
    result = df.copy()
    
    # Step 1: Calculate price comparison (close vs close 4 bars ago)
    result['close_4_bars_ago'] = result['Close'].shift(4)
    
    # Step 2: Setup - Identify potential trend exhaustion
    # For Buy Setup: Current close must be less than close 4 bars ago
    result['buy_setup_condition'] = result['Close'] < result['close_4_bars_ago']
    # For Sell Setup: Current close must be greater than close 4 bars ago
    result['sell_setup_condition'] = result['Close'] > result['close_4_bars_ago']
    
    # Step 3: Count consecutive occurrences for setup
    result['buy_setup_count'] = 0
    result['sell_setup_count'] = 0
    
    # Initialize setup counts
    buy_count = 0
    sell_count = 0
    
    # Calculate setup counts
    for i in range(len(result)):
        if result['buy_setup_condition'].iloc[i]:
            buy_count += 1
            sell_count = 0
        elif result['sell_setup_condition'].iloc[i]:
            sell_count += 1
            buy_count = 0
        else:
            buy_count = 0
            sell_count = 0
            
        result['buy_setup_count'].iloc[i] = buy_count if buy_count <= 9 else 9
        result['sell_setup_count'].iloc[i] = sell_count if sell_count <= 9 else 9
    
    # Step 4: Identify setup completion (9 consecutive bars)
    result['buy_setup_complete'] = (result['buy_setup_count'] == 9)
    result['sell_setup_complete'] = (result['sell_setup_count'] == 9)
    
    # Step 5: Generate signals
    result['demark_signal'] = 0  # 0: No signal, 1: Buy signal, -1: Sell signal
    
    # Buy signal: Setup count reaches 9 (bullish exhaustion)
    buy_indices = result.index[result['buy_setup_complete']]
    if not buy_indices.empty:
        for idx in buy_indices:
            result.loc[idx, 'demark_signal'] = 1
    
    # Sell signal: Setup count reaches 9 (bearish exhaustion)
    sell_indices = result.index[result['sell_setup_complete']]
    if not sell_indices.empty:
        for idx in sell_indices:
            result.loc[idx, 'demark_signal'] = -1
            
    # Clean up intermediate calculations
    result = result.drop(['close_4_bars_ago', 'buy_setup_condition', 'sell_setup_condition'], axis=1)
    
    return result

def prepare_demark_data(df):
    """
    Prepare Demark indicator data for frontend display
    
    Args:
        df: DataFrame with Demark indicator calculated
    
    Returns:
        Dictionary with buy/sell signals for frontend
    """
    if df is None or 'demark_signal' not in df.columns:
        return {
            'buySignals': [],
            'sellSignals': []
        }
    
    buy_signals = []
    sell_signals = []
    
    # Find buy signals (value = 1)
    buy_points = df[df['demark_signal'] == 1]
    for idx, row in buy_points.iterrows():
        buy_signals.append({
            'date': idx.strftime('%Y-%m-%d'),
            'price': row['Low'] * 0.99,  # Slightly below the low for visualization
            'value': 1
        })
    
    # Find sell signals (value = -1)
    sell_points = df[df['demark_signal'] == -1]
    for idx, row in sell_points.iterrows():
        sell_signals.append({
            'date': idx.strftime('%Y-%m-%d'),
            'price': row['High'] * 1.01,  # Slightly above the high for visualization
            'value': -1
        })
    
    return {
        'buySignals': buy_signals,
        'sellSignals': sell_signals
    }