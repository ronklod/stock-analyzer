# Stock Analyzer Web Application

A full-stack web application for stock analysis with a React frontend and FastAPI backend.

## Architecture

- **Frontend**: React with TypeScript, Chart.js for visualizations
- **Backend**: FastAPI server using the existing stock analyzer
- **Communication**: RESTful API with JSON responses
- **API Documentation**: Auto-generated Swagger UI at `/docs`

## Setup Instructions

### 1. Backend Setup

First, make sure you have installed the Python dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI backend server:

```bash
python app_fastapi.py
```

The backend will run on `http://localhost:5001`
API documentation available at `http://localhost:5001/docs`

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Start the React development server:

```bash
npm start
```

The frontend will run on `http://localhost:3000`

## How to Use

1. **Start both servers**: Make sure both the FastAPI backend (port 5001) and React frontend (port 3000) are running.

2. **Open the web app**: Navigate to `http://localhost:3000` in your browser.

3. **Analyze a stock**:
   - Enter a stock ticker (e.g., AAPL, GOOGL, MSFT)
   - Click the "Analyze" button
   - View the comprehensive analysis results

4. **Explore API Documentation**: Visit `http://localhost:5001/docs` for interactive API documentation

## Features

### Frontend Features:
- **Modern UI**: Clean, responsive design with smooth animations
- **Real-time Analysis**: Instant stock analysis with loading states
- **Interactive Charts**: Price and volume charts with technical indicators
- **Comprehensive Display**: Shows company info, technical signals, and recommendations

### Backend Features (FastAPI):
- **High Performance**: Async support for better performance
- **Type Safety**: Pydantic models for request/response validation
- **Auto Documentation**: Swagger UI and ReDoc automatically generated
- **RESTful API**: Clean API endpoints for stock analysis
- **Error Handling**: Proper HTTP exceptions with detailed messages
- **CORS Support**: Allows frontend-backend communication

## API Endpoints

### POST /api/analyze
Analyzes a stock and returns comprehensive data.

**Request Body:**
```json
{
  "ticker": "AAPL"
}
```

**Response:**
```json
{
  "ticker": "AAPL",
  "companyInfo": { ... },
  "technicalAnalysis": { ... },
  "sentimentAnalysis": { ... },
  "recommendation": { ... },
  "chartData": { ... }
}
```

### GET /api/health
Health check endpoint to verify the API is running.

### GET /docs
Interactive API documentation (Swagger UI)

### GET /redoc
Alternative API documentation (ReDoc)

## Project Structure

```
stock-analyzer/
├── app_fastapi.py         # FastAPI backend server
├── app.py                 # Original Flask server (deprecated)
├── stock_analyzer.py      # Core analysis logic
├── requirements.txt       # Python dependencies
├── frontend/             # React frontend
│   ├── package.json      # Node dependencies
│   ├── public/           # Static files
│   └── src/              # React source code
│       ├── App.tsx       # Main app component
│       ├── components/   # React components
│       └── types/        # TypeScript definitions
```

## Why FastAPI?

We migrated from Flask to FastAPI for several benefits:
- **Better Performance**: Built on Starlette and Pydantic for high performance
- **Automatic API Documentation**: Interactive docs generated automatically
- **Type Hints**: Full type safety with Python type hints
- **Async Support**: Native async/await support for better concurrency
- **Data Validation**: Automatic request/response validation with Pydantic
- **Modern Python**: Uses latest Python features and best practices

## Deployment Options

### Development Mode

Run both servers separately for development:

```bash
./run_webapp.sh
```

This starts:
- FastAPI backend on http://localhost:5001
- React dev server on http://localhost:3000

### Production Mode

Build React app and serve it directly from FastAPI:

```bash
./run_webapp_prod.sh
```

This:
1. Builds the React frontend
2. Serves both frontend and API from http://localhost:5001

## Troubleshooting

1. **CORS Issues**: Make sure the FastAPI server has CORS middleware configured (already set up in app_fastapi.py)

2. **Port Conflicts**: If ports 3000 or 5001 are in use, you can change them:
   - Frontend: Edit `package.json` and add `"start": "PORT=3001 react-scripts start"`
   - Backend: Edit `app_fastapi.py` and change `uvicorn.run(app, host="0.0.0.0", port=5002)`

3. **Module Not Found**: Make sure to run `npm install` in the frontend directory

4. **API Connection Failed**: Ensure the backend is running before making requests from the frontend

5. **Production Build Issues**: If the production build fails, check:
   - Node.js and npm are installed
   - All dependencies are installed with `npm install`
   - There are no TypeScript errors in the codebase

## Future Enhancements

- Add WebSocket support for real-time price updates
- Implement user authentication with JWT tokens
- Add portfolio tracking functionality
- Enable batch stock analysis
- Add more chart types (candlestick, etc.)
- Implement caching for better performance
- Add rate limiting for API protection 