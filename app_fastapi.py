#!/usr/bin/env python3
"""
FastAPI server for Stock Analyzer
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uvicorn
from stock_analyzer import StockAnalyzer
from nasdaq100_analyzer import NASDAQ100Screener
import logging
import numpy as np
import math

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

class StockAnalysisResponse(BaseModel):
    ticker: str
    companyInfo: CompanyInfo
    technicalAnalysis: TechnicalAnalysis
    sentimentAnalysis: SentimentAnalysis
    recommendation: Recommendation
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

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Stock Analyzer API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001) 