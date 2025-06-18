#!/usr/bin/env python3
"""
FastAPI server for Stock Analyzer
"""

from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from stock_analysis.stock_analyzer import StockAnalyzer
from stock_analysis.nasdaq100_analyzer import NASDAQ100Screener
from stock_analysis.sp500_analyzer import SP500Screener
from stock_analysis.mag7_analyzer import MAG7Screener
from database.database import get_db, engine
from database import WatchlistItem, User, Base
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging
import numpy as np
import math
from enum import Enum
import pandas as pd
import requests
from authlib.integrations.requests_client import OAuth2Session
from auth import (
    authenticate_user, create_access_token, get_current_user, UserCreate, 
    Token, UserResponse, create_user, get_user, create_or_update_google_user,
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, ACCESS_TOKEN_EXPIRE_MINUTES
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Stock Analyzer API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],  # React frontend and others
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory where the React build will be located
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend/build")

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
async def analyze_stock(request: StockRequest, current_user: User = Depends(get_current_user)):
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
    
    # Add Demark indicator data
    if 'buy_setup_count' in df.columns and 'sell_setup_count' in df.columns and 'demark_signal' in df.columns:
        from stock_analysis.demark_indicator import prepare_demark_data
        demark_data = prepare_demark_data(analyzer.df)
        chart_data.indicators['demarkBuySignals'] = demark_data['buySignals']
        chart_data.indicators['demarkSellSignals'] = demark_data['sellSignals']
    
    return chart_data

@app.get("/api/health")
async def health_check(current_user: User = Depends(get_current_user)):
    """Health check endpoint"""
    return {"status": "healthy", "message": "Stock Analyzer API is running"}

@app.get("/api/screen/nasdaq100", response_model=ScreeningResponse)
async def screen_nasdaq100(current_user: User = Depends(get_current_user)):
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
async def screen_sp500(current_user: User = Depends(get_current_user)):
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
async def screen_mag7(current_user: User = Depends(get_current_user)):
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

# Serve React app's static files
@app.get("/", include_in_schema=False)
async def serve_spa():
    """Serve the React SPA's index.html"""
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

# Debug route to create a test user
@app.get("/api/debug/create_test_user")
async def create_test_user(db: Session = Depends(get_db)):
    """Create a test user for debugging purposes"""
    from database import User, pwd_context
    
    # Check if test user already exists
    test_user = db.query(User).filter(User.email == "test@example.com").first()
    if test_user:
        return {"message": "Test user already exists", "user_id": test_user.id}
    
    # Create a new test user
    hashed_password = pwd_context.hash("password123")
    new_user = User(
        email="test@example.com",
        hashed_password=hashed_password,
        display_name="Test User",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "Test user created successfully",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "display_name": new_user.display_name
        }
    }

@app.get("/api")
async def api_root(current_user: User = Depends(get_current_user)):
    """API information endpoint"""
    return {
        "message": "Stock Analyzer API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

# New Watchlist Endpoints
@app.post("/api/watchlist", response_model=WatchlistItemResponse)
async def add_to_watchlist(
    item: WatchlistItemCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a stock to the watchlist (legacy endpoint - redirects to user watchlist)
    """
    try:
        db_item = WatchlistItem(
            symbol=item.symbol.upper(),
            company_name=item.company_name,
            notes=item.notes,
            user_id=current_user.id
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/watchlist", response_model=List[WatchlistItemResponse])
async def get_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all stocks in the watchlist (legacy endpoint - shows only current user's watchlist)
    """
    return db.query(WatchlistItem).filter(WatchlistItem.user_id == current_user.id).all()

@app.delete("/api/watchlist/{item_id}")
async def remove_from_watchlist(
    item_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a stock from the watchlist (legacy endpoint - checks for user ownership)
    """
    item = db.query(WatchlistItem).filter(
        WatchlistItem.id == item_id,
        WatchlistItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully"}

@app.get("/api/watchlist/check/{symbol}")
async def check_watchlist(
    symbol: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if a stock is in the watchlist (legacy endpoint - checks current user's watchlist)
    """
    item = db.query(WatchlistItem).filter(
        WatchlistItem.symbol == symbol.upper(),
        WatchlistItem.user_id == current_user.id
    ).first()
    return {
        "in_watchlist": bool(item), 
        "item_id": item.id if item else None,
        "notes": item.notes if item else None
    }

# Authentication endpoints
@app.post("/api/auth/register", response_model=Token)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    db_user = get_user(db, email=user_data.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = create_user(db=db, user=user_data)
    
    # Create access token for the new user
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}, 
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token, 
        token_type="bearer", 
        user_id=user.id,
        email=user.email, 
        display_name=user.display_name
    )

@app.post("/api/auth/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login to get access token"""
    logging.info(f"Login attempt for user: {form_data.username}")
    try:
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            logging.warning(f"Failed login attempt for {form_data.username}: Invalid credentials")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        logging.info(f"Successful login for user: {form_data.username}")
    except Exception as e:
        logging.error(f"Error during login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login error: {str(e)}",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}, 
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token, 
        token_type="bearer", 
        user_id=user.id,
        email=user.email, 
        display_name=user.display_name
    )

@app.get("/api/auth/me", response_model=UserResponse)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

@app.get("/api/auth/google/login")
async def login_google():
    """Initiate Google OAuth login flow"""
    # Set up Google OAuth
    google = OAuth2Session(
        client_id=GOOGLE_CLIENT_ID,
        scope="openid email profile",
        redirect_uri=GOOGLE_REDIRECT_URI,
    )
    
    # Generate authorization URL
    authorization_url, state = google.create_authorization_url(
        "https://accounts.google.com/o/oauth2/auth",
        access_type="offline",
        prompt="select_account"
    )
    
    # Return the authorization URL
    return {"authorization_url": authorization_url}

@app.get("/api/auth/google/callback")
async def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    try:
        # Set up Google OAuth
        google = OAuth2Session(
            client_id=GOOGLE_CLIENT_ID,
            redirect_uri=GOOGLE_REDIRECT_URI,
        )
        
        # Get token using the authorization code
        token = google.fetch_token(
            "https://oauth2.googleapis.com/token",
            code=code,
            client_secret=GOOGLE_CLIENT_SECRET,
        )
        
        # Get user info from Google
        user_info_response = google.get("https://www.googleapis.com/oauth2/v3/userinfo")
        user_info = user_info_response.json()
        
        # Create or update user in the database
        user = create_or_update_google_user(db, user_info)
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.id},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        
        # Create a redirect URL with the token for the frontend
        frontend_url = "/"
        redirect_url = f"{frontend_url}?token={access_token}&userId={user.id}&email={user.email}&displayName={user.display_name or ''}"
        
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        logger.error(f"Error in Google callback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in Google authentication: {str(e)}")

# Protected watchlist endpoints that require authentication
@app.post("/api/user/watchlist", response_model=WatchlistItemResponse)
async def add_to_user_watchlist(
    item: WatchlistItemCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a stock to the user's watchlist"""
    try:
        db_item = WatchlistItem(
            symbol=item.symbol.upper(),
            company_name=item.company_name,
            notes=item.notes,
            user_id=current_user.id
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/user/watchlist", response_model=List[WatchlistItemResponse])
async def get_user_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all stocks in the user's watchlist"""
    return db.query(WatchlistItem).filter(WatchlistItem.user_id == current_user.id).all()

@app.get("/api/user/watchlist/check/{symbol}")
async def check_user_watchlist(
    symbol: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if a stock is in the user's watchlist"""
    item = db.query(WatchlistItem).filter(
        WatchlistItem.symbol == symbol.upper(),
        WatchlistItem.user_id == current_user.id
    ).first()
    
    return {
        "in_watchlist": bool(item), 
        "item_id": item.id if item else None,
        "notes": item.notes if item else None
    }

@app.delete("/api/user/watchlist/{item_id}")
async def remove_from_user_watchlist(
    item_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a stock from the user's watchlist"""
    item = db.query(WatchlistItem).filter(
        WatchlistItem.id == item_id,
        WatchlistItem.user_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully"}

# Mount static files for React app if the build directory exists
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=os.path.join(FRONTEND_DIR, "static")), name="static")
    
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_paths(full_path: str):
        """Serve the React SPA for all non-API paths"""
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API path not found")
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
else:
    logger.warning(f"Frontend build directory not found: {FRONTEND_DIR}")
    logger.warning("React app will not be served. Run 'npm run build' in frontend directory first.")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)