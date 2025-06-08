#!/usr/bin/env python3
"""
FastAPI server for Stock Analyzer
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uvicorn
from stock_analyzer import StockAnalyzer
from nasdaq100_analyzer import NASDAQ100Screener
from sp500_analyzer import SP500Screener
from mag7_analyzer import MAG7Screener
from database import get_db, WatchlistItem
from sqlalchemy.orm import Session
from datetime import datetime
import logging
import numpy as np
import math
from enum import Enum
import pandas as pd

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Stock Analyzer API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper functions to handle NaN and infinity values
def clean_float(value):
    """Convert float to JSON-safe value"""
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        if math.isnan(value) or math.isinf(value):
            return 0.0
        return float(value)
    return 0.0

def clean_float_list(values):
    """Convert list of floats to JSON-safe values"""
    if values is None:
        return []
    return [clean_float(v) for v in values]

# Request/Response models
class StockRequest(BaseModel):
    ticker: str

class CompanyInfo(BaseModel):
    name: str
    sector: str
    currentPrice: float
    previousClose: float
    dayChange: float
    dayChangePercent: float
    fiftyTwoWeekLow: float
    fiftyTwoWeekHigh: float
    marketCap: float
    volume: float
    averageVolume: float
    pe: float
    eps: float
    dividend: float

class TechnicalAnalysis(BaseModel):
    score: float
    signals: Dict[str, str]

class NewsArticle(BaseModel):
    title: str
    url: str
    source: str
    sentiment: float
    date: str
    summary: str

class SentimentAnalysis(BaseModel):
    score: float
    description: str
    articles: List[NewsArticle]

class Recommendation(BaseModel):
    recommendation: str
    confidence: float
    technical_score: float
    sentiment_score: float
    combined_score: float
    description: str

class ChartData(BaseModel):
    dates: list[str]
    ohlc: Dict[str, list[float]]
    volume: list[float]
    indicators: Dict[str, Optional[list[float]]]

class LatestData(BaseModel):
    close: float
    volume: int
    rsi: Optional[float]
    sma20: Optional[float]
    sma50: Optional[float]

class SupportResistanceType(str, Enum):
    SUPPORT = 'Support'
    RESISTANCE = 'Resistance'

class SupportResistanceLevel(BaseModel):
    price: float
    type: SupportResistanceType
    strength: float

class PriceTargets(BaseModel):
    current_price: float
    stop_loss: float
    target_1: float
    target_2: float
    risk_reward: float

class StockAnalysisResponse(BaseModel):
    ticker: str
    companyInfo: CompanyInfo
    technicalAnalysis: TechnicalAnalysis
    sentimentAnalysis: SentimentAnalysis
    recommendation: Recommendation
    priceTargets: PriceTargets
    supportResistanceLevels: List[SupportResistanceLevel]
    chartData: ChartData
    latestData: LatestData

class TopStock(BaseModel):
    symbol: str
    name: str
    sector: str
    currentPrice: float
    marketCap: float
    peRatio: float
    recommendation: str
    combinedScore: float
    technicalScore: float
    sentimentScore: float
    confidence: float
    pricePosition52w: float
    volumeRatio: float
    momentum20d: float
    attractivenessScore: float
    description: str

class ScreeningResponse(BaseModel):
    topStocks: List[TopStock]
    totalAnalyzed: int
    failedSymbols: List[str]

# New Watchlist Models
class WatchlistItemCreate(BaseModel):
    symbol: str
    company_name: str
    notes: Optional[str] = None

class WatchlistItemResponse(BaseModel):
    id: int
    symbol: str
    company_name: str
    added_date: datetime
    notes: Optional[str]

@app.post("/api/analyze", response_model=StockAnalysisResponse)
async def analyze_stock(request: StockRequest):
    """
    Analyze a stock and return comprehensive results
    """
    ticker = request.ticker.upper()
    
    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker symbol is required")
    
    logger.info(f"Analyzing stock: {ticker}")
    
    try:
        # Create analyzer instance
        analyzer = StockAnalyzer(ticker)
        
        # Fetch stock data
        if not analyzer.fetch_stock_data():
            raise HTTPException(
                status_code=404, 
                detail=f"Failed to fetch data for {ticker}. Please check the ticker symbol."
            )
        
        # Get company info
        try:
            info = analyzer.stock.info
            company_info = CompanyInfo(
                name=info.get('longName', 'N/A'),
                sector=info.get('sector', 'N/A'),
                currentPrice=clean_float(info.get('currentPrice', 0)),
                previousClose=clean_float(info.get('previousClose', 0)),
                dayChange=clean_float(info.get('currentPrice', 0) - info.get('previousClose', 0)) if info.get('currentPrice') and info.get('previousClose') else 0,
                dayChangePercent=clean_float(((info.get('currentPrice', 0) - info.get('previousClose', 0)) / info.get('previousClose', 1) * 100)) if info.get('previousClose') else 0,
                fiftyTwoWeekLow=clean_float(info.get('fiftyTwoWeekLow', 0)),
                fiftyTwoWeekHigh=clean_float(info.get('fiftyTwoWeekHigh', 0)),
                marketCap=clean_float(info.get('marketCap', 0)),
                volume=clean_float(info.get('volume', 0)),
                averageVolume=clean_float(info.get('averageVolume', 0)),
                pe=clean_float(info.get('trailingPE', 0)),
                eps=clean_float(info.get('trailingEps', 0)),
                dividend=clean_float(info.get('dividendYield', 0) * 100) if info.get('dividendYield') else 0
            )
        except:
            company_info = CompanyInfo(
                name=ticker,
                sector='N/A',
                currentPrice=clean_float(analyzer.df['Close'].iloc[-1]) if len(analyzer.df) > 0 else 0,
                previousClose=0,
                dayChange=0,
                dayChangePercent=0,
                fiftyTwoWeekLow=0,
                fiftyTwoWeekHigh=0,
                marketCap=0,
                volume=0,
                averageVolume=0,
                pe=0,
                eps=0,
                dividend=0
            )
        
        # Calculate technical indicators
        analyzer.calculate_technical_indicators()
        
        # Analyze technical signals
        tech_analysis = analyzer.analyze_technical_signals()
        
        # Analyze news sentiment
        analyzer.fetch_news_sentiment()
        
        # Generate recommendation
        recommendation = analyzer.generate_recommendation()
        
        # Generate recommendation description
        recommendation_description = analyzer.generate_recommendation_description(tech_analysis['signals'])
        
        # Create chart data
        chart_data = create_chart_data(analyzer)
        
        # Calculate support and resistance levels
        support_resistance = []
        
        # Add Bollinger Bands as support/resistance
        if 'BB_upper' in analyzer.df.columns and 'BB_lower' in analyzer.df.columns:
            bb_upper = analyzer.df['BB_upper'].iloc[-1]
            bb_lower = analyzer.df['BB_lower'].iloc[-1]
            bb_width = bb_upper - bb_lower
            
            if not pd.isna(bb_upper):
                support_resistance.append(
                    SupportResistanceLevel(
                        price=clean_float(bb_upper),
                        type=SupportResistanceType.RESISTANCE,
                        strength=70.0  # Higher strength for Bollinger Band levels
                    )
                )
            
            if not pd.isna(bb_lower):
                support_resistance.append(
                    SupportResistanceLevel(
                        price=clean_float(bb_lower),
                        type=SupportResistanceType.SUPPORT,
                        strength=70.0
                    )
                )
        
        # Add moving averages as support/resistance
        if 'SMA_20' in analyzer.df.columns:
            sma20 = analyzer.df['SMA_20'].iloc[-1]
            current_price = analyzer.df['Close'].iloc[-1]
            
            if not pd.isna(sma20):
                support_resistance.append(
                    SupportResistanceLevel(
                        price=clean_float(sma20),
                        type=SupportResistanceType.SUPPORT if current_price > sma20 else SupportResistanceType.RESISTANCE,
                        strength=60.0
                    )
                )
        
        # Sort levels by price
        support_resistance.sort(key=lambda x: x.price)

        # Prepare response
        response = StockAnalysisResponse(
            ticker=ticker,
            companyInfo=company_info,
            technicalAnalysis=TechnicalAnalysis(
                score=clean_float(tech_analysis['score']),
                signals=tech_analysis['signals']
            ),
            sentimentAnalysis=SentimentAnalysis(
                score=clean_float(analyzer.news_sentiment),
                description='Positive' if analyzer.news_sentiment > 0 else 'Negative' if analyzer.news_sentiment < 0 else 'Neutral',
                articles=analyzer.news_articles
            ),
            recommendation=Recommendation(
                recommendation=recommendation['recommendation'],
                confidence=clean_float(recommendation['confidence']),
                technical_score=clean_float(recommendation['technical_score']),
                sentiment_score=clean_float(recommendation['sentiment_score']),
                combined_score=clean_float(recommendation['combined_score']),
                description=recommendation_description
            ),
            priceTargets=PriceTargets(
                current_price=clean_float(analyzer.df['Close'].iloc[-1]),
                stop_loss=clean_float(bb_lower) if 'BB_lower' in analyzer.df.columns and not pd.isna(bb_lower) else 0,
                target_1=clean_float(bb_upper) if 'BB_upper' in analyzer.df.columns and not pd.isna(bb_upper) else 0,
                target_2=clean_float(bb_upper * 1.05) if 'BB_upper' in analyzer.df.columns and not pd.isna(bb_upper) else 0,
                risk_reward=clean_float(3.0)  # Default risk/reward ratio
            ),
            supportResistanceLevels=support_resistance,
            chartData=chart_data,
            latestData=LatestData(
                close=clean_float(analyzer.df['Close'].iloc[-1]),
                volume=int(analyzer.df['Volume'].iloc[-1]),
                rsi=clean_float(analyzer.df['RSI'].iloc[-1]) if 'RSI' in analyzer.df.columns and not analyzer.df['RSI'].isna().iloc[-1] else None,
                sma20=clean_float(analyzer.df['SMA_20'].iloc[-1]) if 'SMA_20' in analyzer.df.columns and not analyzer.df['SMA_20'].isna().iloc[-1] else None,
                sma50=clean_float(analyzer.df['SMA_50'].iloc[-1]) if 'SMA_50' in analyzer.df.columns and not analyzer.df['SMA_50'].isna().iloc[-1] else None,
            )
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing stock: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def create_chart_data(analyzer) -> ChartData:
    """
    Create chart data for frontend visualization
    """
    df = analyzer.df.copy()
    
    # Replace NaN values with None for proper JSON serialization
    df = df.fillna(0)
    
    df.index = df.index.strftime('%Y-%m-%d')
    
    # Prepare data for charts
    chart_data = ChartData(
        dates=df.index.tolist(),
        ohlc={
            'open': clean_float_list(df['Open'].tolist()),
            'high': clean_float_list(df['High'].tolist()),
            'low': clean_float_list(df['Low'].tolist()),
            'close': clean_float_list(df['Close'].tolist())
        },
        volume=clean_float_list(df['Volume'].tolist()),
        indicators={}
    )
    
    # Add technical indicators if available
    if 'SMA_20' in df.columns:
        chart_data.indicators['sma20'] = clean_float_list(df['SMA_20'].tolist())
    if 'SMA_50' in df.columns:
        chart_data.indicators['sma50'] = clean_float_list(df['SMA_50'].tolist())
    if 'SMA_150' in df.columns:
        chart_data.indicators['sma150'] = clean_float_list(df['SMA_150'].tolist())
    if 'SMA_200' in df.columns:
        chart_data.indicators['sma200'] = clean_float_list(df['SMA_200'].tolist())
    if 'BB_upper' in df.columns:
        chart_data.indicators['bbUpper'] = clean_float_list(df['BB_upper'].tolist())
    if 'BB_lower' in df.columns:
        chart_data.indicators['bbLower'] = clean_float_list(df['BB_lower'].tolist())
    if 'RSI' in df.columns:
        chart_data.indicators['rsi'] = clean_float_list(df['RSI'].tolist())
    if 'MACD' in df.columns:
        chart_data.indicators['macd'] = clean_float_list(df['MACD'].tolist())
    if 'MACD_signal' in df.columns:
        chart_data.indicators['macdSignal'] = clean_float_list(df['MACD_signal'].tolist())
    if 'MACD_diff' in df.columns:
        chart_data.indicators['macdHist'] = clean_float_list(df['MACD_diff'].tolist())
    if 'CCI' in df.columns:
        chart_data.indicators['cci'] = clean_float_list(df['CCI'].tolist())
    
    return chart_data

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Stock Analyzer API is running"}

@app.get("/api/screen/nasdaq100", response_model=ScreeningResponse)
async def screen_nasdaq100():
    """
    Screen all NASDAQ-100 stocks and return the top 10 most attractive ones
    """
    logger.info("Starting NASDAQ-100 screening...")
    
    try:
        # Create screener instance
        screener = NASDAQ100Screener()
        
        # Run screening (this will take some time)
        top_stocks_data = screener.screen_all_stocks(max_workers=5)  # Reduced workers to avoid rate limiting
        
        # Convert to response format
        top_stocks = []
        for stock in top_stocks_data:
            top_stocks.append(TopStock(
                symbol=stock['symbol'],
                name=stock['name'],
                sector=stock['sector'],
                currentPrice=clean_float(stock['current_price']),
                marketCap=clean_float(stock['market_cap']),
                peRatio=clean_float(stock['pe_ratio']),
                recommendation=stock['recommendation'],
                combinedScore=clean_float(stock['combined_score']),
                technicalScore=clean_float(stock['technical_score']),
                sentimentScore=clean_float(stock['sentiment_score']),
                confidence=clean_float(stock['confidence']),
                pricePosition52w=clean_float(stock['price_position_52w']),
                volumeRatio=clean_float(stock['volume_ratio']),
                momentum20d=clean_float(stock['momentum_20d']),
                attractivenessScore=clean_float(stock['attractiveness_score']),
                description=stock['description']
            ))
        
        response = ScreeningResponse(
            topStocks=top_stocks,
            totalAnalyzed=len(screener.results),
            failedSymbols=screener.failed_symbols
        )
        
        logger.info(f"Screening completed. Found {len(top_stocks)} top stocks.")
        return response
        
    except Exception as e:
        logger.error(f"Error during NASDAQ-100 screening: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/screen/sp500", response_model=ScreeningResponse)
async def screen_sp500():
    """
    Screen all S&P 500 stocks and return the top 10 most attractive ones
    """
    logger.info("Starting S&P 500 screening...")
    
    try:
        # Create screener instance
        screener = SP500Screener()
        
        # Run screening (this will take some time)
        top_stocks_data = screener.screen_all_stocks(max_workers=5)  # Reduced workers to avoid rate limiting
        
        # Convert to response format
        top_stocks = []
        for stock in top_stocks_data:
            top_stocks.append(TopStock(
                symbol=stock['symbol'],
                name=stock['name'],
                sector=stock['sector'],
                currentPrice=clean_float(stock['current_price']),
                marketCap=clean_float(stock['market_cap']),
                peRatio=clean_float(stock['pe_ratio']),
                recommendation=stock['recommendation'],
                combinedScore=clean_float(stock['combined_score']),
                technicalScore=clean_float(stock['technical_score']),
                sentimentScore=clean_float(stock['sentiment_score']),
                confidence=clean_float(stock['confidence']),
                pricePosition52w=clean_float(stock['price_position_52w']),
                volumeRatio=clean_float(stock['volume_ratio']),
                momentum20d=clean_float(stock['momentum_20d']),
                attractivenessScore=clean_float(stock['attractiveness_score']),
                description=stock['description']
            ))
        
        response = ScreeningResponse(
            topStocks=top_stocks,
            totalAnalyzed=len(screener.results),
            failedSymbols=screener.failed_symbols
        )
        
        logger.info(f"Screening completed. Found {len(top_stocks)} top stocks.")
        return response
        
    except Exception as e:
        logger.error(f"Error during S&P 500 screening: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/screen/mag7", response_model=ScreeningResponse)
async def screen_mag7():
    """
    Screen all MAG7 stocks and return them ranked by attractiveness
    """
    logger.info("Starting MAG7 screening...")
    
    try:
        # Create screener instance
        screener = MAG7Screener()
        
        # Run screening
        stocks_data = screener.screen_all_stocks()
        
        # Convert to response format
        stocks = []
        for stock in stocks_data:
            stocks.append(TopStock(
                symbol=stock['symbol'],
                name=stock['name'],
                sector=stock['sector'],
                currentPrice=clean_float(stock['current_price']),
                marketCap=clean_float(stock['market_cap']),
                peRatio=clean_float(stock['pe_ratio']),
                recommendation=stock['recommendation'],
                combinedScore=clean_float(stock['combined_score']),
                technicalScore=clean_float(stock['technical_score']),
                sentimentScore=clean_float(stock['sentiment_score']),
                confidence=clean_float(stock['confidence']),
                pricePosition52w=clean_float(stock['price_position_52w']),
                volumeRatio=clean_float(stock['volume_ratio']),
                momentum20d=clean_float(stock['momentum_20d']),
                attractivenessScore=clean_float(stock['attractiveness_score']),
                description=stock['description']
            ))
        
        response = ScreeningResponse(
            topStocks=stocks,
            totalAnalyzed=len(screener.results),
            failedSymbols=screener.failed_symbols
        )
        
        logger.info(f"Screening completed. Analyzed {len(stocks)} MAG7 stocks.")
        return response
        
    except Exception as e:
        logger.error(f"Error during MAG7 screening: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Stock Analyzer API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

# New Watchlist Endpoints
@app.post("/api/watchlist", response_model=WatchlistItemResponse)
async def add_to_watchlist(item: WatchlistItemCreate, db: Session = Depends(get_db)):
    """
    Add a stock to the watchlist
    """
    try:
        db_item = WatchlistItem(
            symbol=item.symbol.upper(),
            company_name=item.company_name,
            notes=item.notes
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/watchlist", response_model=List[WatchlistItemResponse])
async def get_watchlist(db: Session = Depends(get_db)):
    """
    Get all stocks in the watchlist
    """
    return db.query(WatchlistItem).all()

@app.delete("/api/watchlist/{item_id}")
async def remove_from_watchlist(item_id: int, db: Session = Depends(get_db)):
    """
    Remove a stock from the watchlist
    """
    item = db.query(WatchlistItem).filter(WatchlistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully"}

@app.get("/api/watchlist/check/{symbol}")
async def check_watchlist(symbol: str, db: Session = Depends(get_db)):
    """
    Check if a stock is in the watchlist
    """
    item = db.query(WatchlistItem).filter(WatchlistItem.symbol == symbol.upper()).first()
    return {"in_watchlist": bool(item), "item_id": item.id if item else None}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001) 